// Some libraries (like ali-oss) expect 'window' to exist.
// This must be imported before any other imports that might use 'window'.

if (typeof self !== 'undefined' && typeof (self as any).window === 'undefined') {
    (self as any).window = self;
}
