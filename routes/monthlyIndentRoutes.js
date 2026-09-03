import express from 'express';

import {
    createMonthlyIndent,
    getMonthlyIndents,
    getMonthlyIndentById,
    updateMonthlyIndent,
    deleteMonthlyIndent,
} from '../controllers/monthlyIndentController.js';

const router = express.Router();

router.post('/', createMonthlyIndent);

router.get('/', getMonthlyIndents);

router.get('/:id', getMonthlyIndentById);

router.put('/:id', updateMonthlyIndent);

router.delete('/:id', deleteMonthlyIndent);

export default router;