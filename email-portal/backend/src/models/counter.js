const mongoose = require('mongoose');

/**
 * Generic atomic counter, used to mint sequential, human-readable
 * request IDs (e.g. EM-01-2026-000001) without race conditions.
 *
 * One document per counter "key" (e.g. "EM-01-2026"). Incrementing is a
 * single atomic findOneAndUpdate with $inc + upsert, so two concurrent
 * submissions can never receive the same sequence number.
 */
const CounterSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // the counter key, e.g. "EM-01-2026"
    seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', CounterSchema);

/**
 * Atomically increments and returns the next sequence number for `key`.
 * @param {String} key
 * @returns {Promise<Number>}
 */
const getNextSequence = async (key) => {
    const doc = await Counter.findOneAndUpdate(
        { _id: key },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return doc.seq;
};

module.exports = { Counter, getNextSequence };