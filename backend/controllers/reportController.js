const { validateDailyReportDate } = require('../validation/readingValidation');
const reportService = require('../services/reportService');

async function daily(req, res, next) {
  try {
    const parsedDate = validateDailyReportDate(req.query.date);
    const report = await reportService.getDailyReport(req.user.id, parsedDate);
    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err) {
    next(err);
  }
}

async function monthToDate(req, res, next) {
  try {
    const report = await reportService.getMonthToDateReport(req.user.id);
    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err) {
    next(err);
  }
}

async function previousMonth(req, res, next) {
  try {
    const report = await reportService.getPreviousMonthReport(req.user.id);
    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { daily, monthToDate, previousMonth };
