import express from 'express'
import { register, login, dashbord, deposit, withdraw, sendmoney, contact, exchange, profile, update, passwordchange, Activity, forgot, isLoginUser, logout, newUserVeify, verifyOtpController } from '../controllers/user-Controller.js';
import { isAuthenticatedUser } from '../middlewares/auth.js';
const router = express.Router()


router.post('/signup', register)
router.post('/login', login)
router.post('/forgotpassword', forgot)
router.post('/verifyOtp', newUserVeify)
router.post('/verifyOtpForgot', verifyOtpController)

router.get('/checkIslogin', isAuthenticatedUser, isLoginUser)
router.post('/dashbord', isAuthenticatedUser, dashbord)
router.post('/deposit', isAuthenticatedUser, deposit)
router.post('/withdraw', isAuthenticatedUser, withdraw)
router.post('/sendmony', isAuthenticatedUser, sendmoney)
router.post('/contact', isAuthenticatedUser, contact)
router.post('/exchange', isAuthenticatedUser, exchange)
router.post('/profile', isAuthenticatedUser, profile)
router.post('/profile/update', isAuthenticatedUser, update)
router.post('/profile/passwordchange', isAuthenticatedUser, passwordchange)
router.get('/activity', isAuthenticatedUser, Activity)
router.get('/logout', isAuthenticatedUser, logout)



export default router;

