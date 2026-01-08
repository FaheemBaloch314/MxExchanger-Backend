import express from 'express'
import { authorizeRoles, isAuthenticatedAdmin, isAuthenticatedUser } from '../middlewares/auth.js';
import { deleteUser, rates, updateRates, users, deposit, cancalRequest, acceptRequest, adminDashBord, withdraw, cancalRequestWithdraw, messaages, acceptRequestWithdraw, alllWithdraws, allDeposits, deleteWithdraw, deleteDeposit, isAdmin, accounts, AccountsOpration } from '../controllers/admin-controller.js';


const router = express.Router()




router.get('/isAdmin', isAuthenticatedUser, authorizeRoles('admin'), isAuthenticatedAdmin, isAdmin)
router.get('/rates', isAuthenticatedUser, authorizeRoles('admin'), isAuthenticatedAdmin, rates)
router.put('/rates', isAuthenticatedUser, authorizeRoles('admin'), isAuthenticatedAdmin, updateRates)
router.get('/users', isAuthenticatedUser, authorizeRoles('admin'), isAuthenticatedAdmin, users)
router.delete('/users/:id', isAuthenticatedUser, authorizeRoles('admin'), isAuthenticatedAdmin, deleteUser)
router.get('/admin/deposits', isAuthenticatedUser, authorizeRoles('admin'), isAuthenticatedAdmin, deposit)
router.put('/admin/deposits/:id', isAuthenticatedUser, authorizeRoles('admin'), isAuthenticatedAdmin, cancalRequest)
router.post('/admin/deposits/:id', isAuthenticatedUser, authorizeRoles('admin'), isAuthenticatedAdmin, acceptRequest)
router.get('/admin', isAuthenticatedUser, authorizeRoles('admin'), isAuthenticatedAdmin, adminDashBord)
router.get('/admin/withdraw', isAuthenticatedUser, authorizeRoles('admin'), isAuthenticatedAdmin, withdraw)
router.put('/admin/withdraw/:id', isAuthenticatedUser, authorizeRoles('admin'), isAuthenticatedAdmin, cancalRequestWithdraw)
router.post('/admin/withdraw/:id', isAuthenticatedUser, authorizeRoles('admin'), isAuthenticatedAdmin, acceptRequestWithdraw)
router.get('/admin/all/withdraws', isAuthenticatedUser, authorizeRoles('admin'), isAuthenticatedAdmin, alllWithdraws)
router.get('/admin/all/deposits', isAuthenticatedUser, authorizeRoles('admin'), isAuthenticatedAdmin, allDeposits)
router.delete('/admin/all/withdraws/:id', isAuthenticatedUser, authorizeRoles('admin'), isAuthenticatedAdmin, deleteWithdraw)
router.delete('/admin/all/deposits/:id', isAuthenticatedUser, authorizeRoles('admin'), isAuthenticatedAdmin, deleteDeposit)
router.get('/admin/all/messages', isAuthenticatedUser, authorizeRoles('admin'), isAuthenticatedAdmin, messaages)
router.get('/admin/accounts', isAuthenticatedUser, authorizeRoles('admin'), isAuthenticatedAdmin, accounts)
router.post('/admin/opration', isAuthenticatedUser, authorizeRoles('admin'), isAuthenticatedAdmin, AccountsOpration)




export default router;