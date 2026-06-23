// Browser shim for Node-only subpath imports used by the 0G SDKs
// (node:fs/promises, stream/promises). These code paths (file reads,
// stream pipelines) are not exercised in the browser — we use MemData,
// not ZgFile — so any actual call here is a programming error.
const notAvailable = () => {
  throw new Error("Node filesystem/stream APIs are not available in the browser");
};

export const pipeline = notAvailable;
export const finished = notAvailable;
export const readFile = notAvailable;
export const writeFile = notAvailable;
export const open = notAvailable;
export const stat = notAvailable;

export default {};
