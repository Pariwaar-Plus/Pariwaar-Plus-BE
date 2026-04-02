import express from 'express';
import { 
    getAllTest,
    getTestDetails,
    postTest, 
    updateTest, 
    deleteTest 
} from '../controllers/test.controller';

const testRouter = express.Router();

testRouter.get("/", (req, res) => {
    res.send(getAllTest(req, res));
});

testRouter.get("/:id", (req, res) => {
    res.send(getTestDetails(req, res));
});

testRouter.post("/", (req, res) => {
    res.send(postTest(req, res));
});

testRouter.put("/:id", (req, res) => {
    res.send(updateTest(req, res));
});

testRouter.delete("/:id", (req, res) => {
    res.send(deleteTest(req, res));
});

export default testRouter;