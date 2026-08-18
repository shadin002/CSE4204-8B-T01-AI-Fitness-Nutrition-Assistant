const Progress = require('../models/Progress');
const syncProfileWeight = require('../utils/syncProfileWeight');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');

function normalizeDate(value) {
  const dateString = String(value || '').slice(0, 10);
  return new Date(`${dateString}T00:00:00.000Z`);
}

function getCurrentAppDate() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: process.env.APP_TIMEZONE || 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function isFutureDate(value) {
  const dateString = String(value || '').slice(0, 10);
  return dateString > getCurrentAppDate();
}

const addProgress = asyncHandler(async (req, res) => {
  const { weight, note, date } = req.body;

  if (isFutureDate(date)) {
    return error(res, 400, 'Progress date cannot be in the future');
  }

  const normalizedDate = normalizeDate(date);
  const duplicate = await Progress.findOne({ userId: req.user._id, date: normalizedDate });
  if (duplicate) {
    return error(res, 409, 'A progress record already exists for this date. Edit the existing record instead.');
  }

  const progress = await Progress.create({
    userId: req.user._id,
    weight,
    note: note || '',
    date: normalizedDate,
  });

  const profile = await syncProfileWeight(req.user._id);
  return success(res, 201, 'Progress record added', { progress, profile });
});

const getProgress = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    Progress.find({ userId: req.user._id })
      .sort({ date: -1, createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit),
    Progress.countDocuments({ userId: req.user._id }),
  ]);

  return success(res, 200, 'Progress history fetched', {
    count: total,
    records,
    pagination: { page, limit, pages: Math.max(Math.ceil(total / limit), 1) },
  });
});

const updateProgress = asyncHandler(async (req, res) => {
  const record = await Progress.findOne({ _id: req.params.id, userId: req.user._id });
  if (!record) return error(res, 404, 'Progress record not found');

  if (req.body.date !== undefined) {
    if (isFutureDate(req.body.date)) {
      return error(res, 400, 'Progress date cannot be in the future');
    }

    const normalizedDate = normalizeDate(req.body.date);
    const duplicate = await Progress.findOne({
      userId: req.user._id,
      date: normalizedDate,
      _id: { $ne: record._id },
    });
    if (duplicate) {
      return error(res, 409, 'A progress record already exists for this date');
    }
    record.date = normalizedDate;
  }

  if (req.body.weight !== undefined) record.weight = req.body.weight;
  if (req.body.note !== undefined) record.note = req.body.note;

  await record.save();
  const profile = await syncProfileWeight(req.user._id);

  return success(res, 200, 'Progress record updated', { progress: record, profile });
});

const deleteProgress = asyncHandler(async (req, res) => {
  const record = await Progress.findOne({ _id: req.params.id, userId: req.user._id });
  if (!record) return error(res, 404, 'Progress record not found');

  await record.deleteOne();
  const profile = await syncProfileWeight(req.user._id);

  return success(res, 200, 'Progress record deleted', { profile });
});

module.exports = { addProgress, getProgress, updateProgress, deleteProgress };