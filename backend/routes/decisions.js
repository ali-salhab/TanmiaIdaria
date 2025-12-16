import express from "express";
import * as decisionController from "../controllers/decisionController.js";
// import auth from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// All routes require authentication
// router.use(auth);

// Get all decisions with filters
router.get("/", decisionController.getAllDecisions);

// Get statistics
router.get("/stats", decisionController.getDecisionStats);

// Get single decision
router.get("/:id", decisionController.getDecisionById);

// Create new decision (with file upload)
router.post(
  "/",
  upload.array("attachments", 10),
  decisionController.createDecision
);

// Update decision (with optional file upload)
router.put(
  "/:id",
  upload.array("attachments", 10),
  decisionController.updateDecision
);

// Delete decision
router.delete("/:id", decisionController.deleteDecision);

// Delete specific attachment
router.delete(
  "/:id/attachments/:attachmentId",
  decisionController.deleteAttachment
);

export default router;
