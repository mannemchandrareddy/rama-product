/**
 * Helper to convert Mongoose ObjectId to string "id" and format documents
 * for API responses that match the Python backend's UUID-based output.
 */
function toJSON(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  obj.id = (obj._id || '').toString();
  delete obj.__v;
  return obj;
}

function toJSONList(docs) {
  return docs.map(toJSON);
}

module.exports = { toJSON, toJSONList };
