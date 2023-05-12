self.addEventListener('push', (event) => {
    const notification = event.data.json();
    // self.registration.showNotification(
    //     notification.title,
    //     notification.options
    // );
    console.log('EVENT NOTIFY', notification);
});
