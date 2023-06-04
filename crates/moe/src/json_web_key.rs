use crate::serde::{Base64, UrlSafe};
use serde::{Deserialize, Serialize};

// This was copied from:
// https://github.com/ruma/ruma/blob/d78c3e11f1a37112316e48272d10f00abc0bfd7a/crates/ruma-common/src/events/room.rs#L209-L240

/// A [JSON Web Key](https://tools.ietf.org/html/rfc7517#appendix-A.3) object.
///
/// To create an instance of this type, first create a `JsonWebKeyInit` and convert it via
/// `JsonWebKey::from` / `.into()`.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct JsonWebKey {
    /// Key type.
    ///
    /// Must be `oct`.
    pub kty: String,

    /// Key operations.
    ///
    /// Must at least contain `encrypt` and `decrypt`.
    pub key_ops: Vec<String>,

    /// Algorithm.
    ///
    /// Must be `A256CTR`.
    pub alg: String,

    /// The key, encoded as url-safe unpadded base64.
    pub k: Base64<UrlSafe>,

    /// Extractable.
    ///
    /// Must be `true`. This is a
    /// [W3C extension](https://w3c.github.io/webcrypto/#iana-section-jwk).
    pub ext: bool,
}
