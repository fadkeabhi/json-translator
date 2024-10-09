function mergeKeys(base: any, insert: any): any {
    // If base is not an object or is null, return insert
    if (typeof base !== 'object' || base === null) {
        return insert;
    }

    // If insert is not an object or is null, return base
    if (typeof insert !== 'object' || insert === null) {
        return base;
    }

    // Handle arrays
    if (Array.isArray(base) && Array.isArray(insert)) {
        return [...base, ...insert.filter(item => !base.includes(item))];
    }

    // Handle objects
    const result = { ...base };

    for (const key in insert) {
        if (Object.prototype.hasOwnProperty.call(insert, key)) {
            if (key in result && typeof result[key] === 'object' && typeof insert[key] === 'object') {
                // Recursively merge nested objects or arrays
                result[key] = mergeKeys(result[key], insert[key]);
            } else if (!(key in result)) {
                // Add new key-value pair from insert if it doesn't exist in base
                result[key] = insert[key];
            }
            // If the key exists in both and is not an object, keep the base value
        }
    }

    return result;
}

// Example usage:
const base = {
    a: 1,
    b: 2,
    c: [1, 2, 3],
    d: { x: 1, y: 2 },
    z: [{ y: 3, z: 4 }],
    e: "keep this"
};

const insert = {
    b: 3,
    c: [3, 4, 5],
    d: { y: 3, z: 4 },
    z: [{ y: 3, z: 4 }],
    f: "new value"
};

const result = mergeKeys(base, insert);
console.log(result);