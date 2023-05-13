
use futures::TryStreamExt;
use sqlx::postgres::{PgListener, PgNotification};
use sqlx::{Executor, PgPool};
use std::sync::atomic::{AtomicI64, Ordering};
use std::time::Duration;

use web_push::*;
use std::fs::File;
use serde::{Deserialize};
use serde_json::json;

#[derive(Debug, Deserialize)]
struct Message {
    pub id: String,
    pub content: String,
    pub room_id: String,
    pub author_id: String,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
struct Payload {
    message: Message,
    subscribers: Vec<SubscriptionInfo>
}

async fn web_notify(subscription_info: SubscriptionInfo) -> Result<(), Box<dyn std::error::Error + Send + Sync + 'static>> {
    // generated with openssl using
    // openssl ecparam -name prime256v1 -genkey -noout -out private.pem
    let vapid_private_key = dotenv::var("VAPID_PRIVATE_KEY_PEM")?;

    //Read signing material for payload.
    let file = File::open(vapid_private_key).unwrap();
    let mut sig_builder = VapidSignatureBuilder::from_pem(file, &subscription_info)?.build()?;

    tokio::spawn(async move {
        //Now add payload and encrypt.
        for i in 0..10 {
            println!("trying: {:?}", subscription_info);
            let mut builder = WebPushMessageBuilder::new(&subscription_info)?;
            let content = json!({
                "title": "I wanna fuck",
                "content": format!("Encrypted payload #{i} to be sent in the notification"),
            });
            let content = serde_json::to_vec(&content).unwrap();
            builder.set_payload(ContentEncoding::Aes128Gcm, &content);
            builder.set_vapid_signature(VapidSignature {
                auth_t: sig_builder.auth_t.clone(),
                auth_k: sig_builder.auth_k.clone(),
            });

            let client = WebPushClient::new().expect("failed to build client");

            let msg = builder.build().expect("failed to build");
            //Finally, send the notification!
            client.send(msg).await.expect("failed to send");
            tokio::time::sleep(Duration::from_secs(3)).await;
        }
        Ok::<_, WebPushError>(())
    });
    Ok(())
}


#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let conn_str =
        std::env::var("DATABASE_URL").expect("Env var DATABASE_URL is required for this example.");

    let pool = PgPool::connect(&conn_str).await?;

    // let (pg_notify_tx, mut pg_notify_rx) = broadcast::channel::<PgNotification>(2);

    let mut listener = PgListener::connect(&conn_str).await?;
    listener.listen_all(["msg_chan"]).await?;

    println!("Starting LISTEN loop.");
    let mut stream = listener.into_stream();
    while let Some(notification) = stream.try_next().await? {
        tokio::spawn(async move {
            deliver_notification(notification).await;
        });
    }

    // let notify_pool = pool.clone();
    let _t = tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(2));
        loop {
            interval.tick().await;
            notify(&pool).await;
        }
    });

    Ok(())
}

async fn deliver_notification(notification: PgNotification) {
    let payload = notification.payload();
    let payload = serde_json::from_str::<Payload>(&payload).unwrap();
    println!("Received notification: {:?}", payload);
    for sub in payload.subscribers {
        web_notify(sub).await.unwrap();
    }
}

async fn notify(pool: &PgPool) {
    static COUNTER: AtomicI64 = AtomicI64::new(0);

    // There's two ways you can invoke `NOTIFY`:
    //
    // 1: `NOTIFY <channel>, '<payload>'` which cannot take bind parameters and
    // <channel> is an identifier which is lowercased unless double-quoted
    //
    // 2: `SELECT pg_notify('<channel>', '<payload>')` which can take bind parameters
    // and <channel> preserves its case
    //
    // We recommend #2 for consistency and usability.

    // language=PostgreSQL
    let res = sqlx::query(
        r#"
-- this emits '{ "payload": N }' as the actual payload
select pg_notify(chan, jsonb_build_object('payload', payload)::text)
from (
         values ('chan6', $1),
                ('chan7', $2),
                ('chan8', $3)
     ) notifies(chan, payload)
    "#,
    )
        .bind(&COUNTER.fetch_add(1, Ordering::SeqCst))
        .bind(&COUNTER.fetch_add(1, Ordering::SeqCst))
        .bind(&COUNTER.fetch_add(1, Ordering::SeqCst))
        .execute(pool)
        .await;

    println!("[from notify]: {:?}", res);
}