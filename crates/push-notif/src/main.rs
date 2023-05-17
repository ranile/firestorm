use futures::TryStreamExt;
use sqlx::postgres::{PgListener, PgNotification};

use serde::{Deserialize, Serialize};
use std::io::Cursor;
use web_push::{
    ContentEncoding, SubscriptionInfo, VapidSignatureBuilder, WebPushClient, WebPushMessageBuilder,
};

#[derive(Debug, Serialize, Deserialize)]
struct Room {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct Author {
    pub id: String,
    pub username: String,
    pub avatar: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Message {
    pub id: String,
    pub room: Room,
    pub author: Author,
    pub content: String,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
struct Payload {
    message: Message,
    subscribers: Vec<SubscriptionInfo>,
}

#[derive(Debug, Serialize)]
enum Operation {
    MessageCreate,
}

#[derive(Debug, Serialize)]
struct Notification<T> {
    op: Operation,
    content: T,
}

async fn web_notify<T: Serialize>(
    vapid_private_key: &[u8],
    subscription_info: SubscriptionInfo,
    content: T,
) {
    let sig_builder = VapidSignatureBuilder::from_pem(Cursor::new(vapid_private_key), &subscription_info)
            .expect("unreachable (private key is verified to be good): VapidSignatureBuilder failed to build")
            .build()
            .expect("unreachable (signature info is verified to be good): VapidSignature failed to build");

    let content = serde_json::to_vec(&content).unwrap();

    tokio::spawn(async move {
        let mut builder = WebPushMessageBuilder::new(&subscription_info)
            .expect("unreachable: pimeys/rust-web-push#47");
        builder.set_payload(ContentEncoding::Aes128Gcm, &content);
        builder.set_vapid_signature(sig_builder);
        let msg = builder.build().expect("failed to build"); // TODO: fallible

        let client = WebPushClient::new().expect("infallible: hyper client can't fail to build");
        client.send(msg).await.expect("failed to send"); // TODO: fallible
    });
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let conn_str = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set.");

    let vapid_private_key: &'static [u8] = {
        // generated with openssl using
        // openssl ecparam -name prime256v1 -genkey -noout -out private.pem
        let path =
            dotenv::var("VAPID_PRIVATE_KEY_PEM").expect("VAPID_PRIVATE_KEY_PEM must be set.");
        let key = tokio::fs::read(path).await?;
        key.leak()
    };

    let mut listener = PgListener::connect(&conn_str).await?;
    listener.listen_all(["msg_chan"]).await?;

    println!("Starting LISTEN loop.");
    let mut stream = listener.into_stream();
    while let Some(notification) = stream.try_next().await? {
        tokio::spawn(async move {
            deliver_notification(vapid_private_key, notification).await;
        });
    }
    Ok(())
}

async fn deliver_notification(vapid_private_key: &[u8], notification: PgNotification) {
    match notification.channel() {
        "msg_chan" => {
            println!("received msg_chan notification: {:?}", notification.payload());
            deliver_msg_notification(vapid_private_key, notification.payload()).await;
        }
        _ => {
            eprintln!("Received unknown notification: {:?}", notification);
        }
    }
}

async fn deliver_msg_notification(vapid_private_key: &[u8], payload: &str) {
    let Payload {
        message,
        subscribers,
    } = serde_json::from_str::<Payload>(payload).unwrap();
    let notification = Notification {
        op: Operation::MessageCreate,
        content: message,
    };
    for sub in subscribers {
        web_notify(vapid_private_key, sub, &notification).await;
    }
}
