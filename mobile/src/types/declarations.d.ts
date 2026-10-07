declare module '*.css';
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';

declare module 'firebase/auth' {
  export * from '@firebase/auth';
  export function getReactNativePersistence(storage: any): any;
}
