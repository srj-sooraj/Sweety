const { validateReadingInput, validateUuidParam } = require('../validation/readingValidation');
const readingService = require('../services/readingService');

async function create(req, res, next) {
  try {
    const input = validateReadingInput(req.body);
    const reading = await readingService.createReading(req.user.id, input);
    res.status(201).json({
      success: true,
      message: 'Glucose reading recorded successfully.',
      data: { reading },
    });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const readings = await readingService.listReadings(req.user.id, req.query);
    res.status(200).json({
      success: true,
      data: { readings },
    });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const id = validateUuidParam(req.params.id);
    const reading = await readingService.getReadingById(req.user.id, id);
    res.status(200).json({
      success: true,
      data: { reading },
    });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const id = validateUuidParam(req.params.id);
    const input = validateReadingInput(req.body);
    const reading = await readingService.updateReading(req.user.id, id, input);
    res.status(200).json({
      success: true,
      message: 'Glucose reading updated successfully.',
      data: { reading },
    });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const id = validateUuidParam(req.params.id);
    const deleted = await readingService.deleteReading(req.user.id, id);
    res.status(200).json({
      success: true,
      message: 'Glucose reading deleted successfully.',
      data: deleted,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getOne, update, remove };
