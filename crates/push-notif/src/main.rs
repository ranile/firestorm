use axum::{
    routing::{post},
    http::StatusCode,
    response::IntoResponse,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use futures::TryStreamExt;
use sqlx::postgres::PgListener;
use sqlx::{Executor, PgPool};
use std::sync::atomic::{AtomicI64, Ordering};
use std::time::Duration;

use web_push::*;
use std::fs::File;
use chrono::{DateTime, Utc};
use serde_json::json;

async fn notify_route(Json(subscription_info): Json<SubscriptionInfo>) {
    web_notify(subscription_info).await.expect("Failed to send notification");
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

            let client = WebPushClient::new()?;

            //Finally, send the notification!
            client.send(builder.build()?).await?;
            tokio::time::sleep(Duration::from_secs(3)).await;
        }
        Ok::<_, WebPushError>(())
    });
    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // build our application with a route
    let app = Router::new()
        // `GET /` goes to `root`
        .route("/api/notify", post(notify_route));
        // `POST /users` goes to `create_user`

    // run our app with hyper, listening globally on port 3000
    axum::Server::bind(&"0.0.0.0:3000".parse().unwrap())
        .serve(app.into_make_service())
        .await.unwrap();

    let conn_str =
        std::env::var("DATABASE_URL").expect("Env var DATABASE_URL is required for this example.");
    println!("Building PG pool. {conn_str}");
    let pool = PgPool::connect(&conn_str).await?;

    let mut listener = PgListener::connect(&conn_str).await?;

    // let notify_pool = pool.clone();
    let _t = tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(2));
        loop {
            interval.tick().await;
            notify(&pool).await;
        }
    });

    println!("Starting LISTEN loop.");

    listener.listen_all(vec!["chan6", "chan1", "chan2"]).await?;

    // Prove that we are buffering messages by waiting for 6 seconds
    // listener.execute("SELECT pg_sleep(6)").await?;

    let mut stream = listener.into_stream();
    while let Some(notification) = stream.try_next().await? {
        println!("[from stream]: {:?}", notification);
    }

    Ok(())
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