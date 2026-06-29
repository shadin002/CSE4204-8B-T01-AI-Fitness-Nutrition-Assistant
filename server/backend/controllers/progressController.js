const Progress = require('../models/Progress');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');

const addProgress = asyncHandler(async (req, res) => {
  const { weight, note, date } = req.body;

  const progress = await Progress.create({
    userId: req.user._id,
    weight,
    note: note || '',
    date: date || Date.now(),
  });

  return success(res, 201, 'Progress record added', { progress });
});

const getProgress = asyncHandler(async (req, res) => {
  const records = await Progress.find({ userId: req.user._id }).sort({ date: -1 });
  return success(res, 200, 'Progress history fetched', { count: records.length, records });
});

const deleteProgress = asyncHandler(async (req, res) => {
  const record = await Progress.findById(req.params.id);

  if (!record) {
    return error(res, 404, 'Progress record not found');
  }

  if (record.userId.toString() !== req.user._id.toString()) {
    return error(res, 403, 'Not authorized to delete this record');
  }

  await record.deleteOne();

  return success(res, 200, 'Progress record deleted', {});
});

module.exports = { addProgress, getProgress, deleteProgress };
