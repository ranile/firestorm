FROM clux/muslrust:stable AS chef
RUN rustup self update # this ensures we have the latest version of rustup so any signature mismatch are caught
RUN cargo install cargo-chef
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json
COPY . .
RUN cargo build --release --target x86_64-unknown-linux-musl
RUN pwd
RUN mv target/x86_64-unknown-linux-musl/release/push-notif /bin/server

FROM alpine AS runtime
COPY --from=builder /bin/server /usr/local/bin/
CMD ["/usr/local/bin/server"]
