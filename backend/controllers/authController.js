const { validateRegisterInput, validateLoginInput } = require('../validation/authValidation');
const authService = require('../services/authService');

async function register(req, res, next) {
  try {
    const input = validateRegisterInput(req.body);
    const result = await authService.registerUser(input);
    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const input = validateLoginInput(req.body);
    const result = await authService.loginUser(input);
    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };
