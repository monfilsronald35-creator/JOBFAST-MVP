// Socket.io singleton so controllers can emit events without circular deps
let _io = null;
export function setIO(instance) { _io = instance; }
export function getIO()         { return _io;      }