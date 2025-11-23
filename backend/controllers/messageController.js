import Message from "../models/Message.js";

// Get chat history between two users
export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { otherUserId } = req.params;

    const messages = await Message.find({
      $or: [
        { from: userId, to: otherUserId },
        { from: otherUserId, to: userId },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(100); // Limit to last 100 messages

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch chat history", error: error.message });
  }
};

// Save a message
export const saveMessage = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { to, message, fromUsername } = req.body;

    const newMessage = new Message({
      from: userId,
      to,
      message,
      fromUsername: fromUsername || req.user.username,
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: "Failed to save message", error: error.message });
  }
};

// Mark messages as read
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { otherUserId } = req.params;

    await Message.updateMany(
      { from: otherUserId, to: userId, read: false },
      { $set: { read: true } }
    );

    res.json({ message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Failed to mark messages as read", error: error.message });
  }
};

// Get unread message count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const count = await Message.countDocuments({
      to: userId,
      read: false,
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Failed to get unread count", error: error.message });
  }
};

