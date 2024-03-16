class NotificationMock {
    static permission: NotificationPermission = 'granted';
    constructor(public title: string, public options?: NotificationOptions) {}
    static requestPermission(callback?: NotificationPermissionCallback): Promise<NotificationPermission> {
      return Promise.resolve(NotificationMock.permission);
    }
  }
  
export default NotificationMock;
