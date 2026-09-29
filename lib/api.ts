// Active storage backend for the app. Currently browser-only (see lib/localApi.ts):
// each device keeps its own todos in localStorage, so no login is needed and
// people never see each other's list. To go back to the shared MongoDB-backed
// API in app/api/todos/ instead, replace this file's contents with:
//   export * from "./remoteApi";
export * from "./localApi";
