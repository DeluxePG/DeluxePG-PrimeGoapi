const express = require('express');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const router = express.Router();

// Send a friend request
router.post('/send', async (req, res) => {
  const { senderId, receiverId } = req.body;

  if (senderId === receiverId) {
    return res.status(400).json({ message: "You can't send a friend request to yourself" });
  }

  try {
    // Check if users exist
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({ message: 'User(s) not found' });
    }

    // Check if a request already exists
    const existingRequest = await FriendRequest.findOne({ sender: senderId, receiver: receiverId });
    if (existingRequest) {
      return res.status(400).json({ message: 'Friend request already exists' });
    }

    // Create a new friend request
    const friendRequest = new FriendRequest({ sender: senderId, receiver: receiverId });
    await friendRequest.save();

    return res.status(200).json({ message: 'Friend request sent' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Accept a friend request
router.post('/accept', async (req, res) => {
  const { requestId } = req.body;

  try {
    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    // If the status is already accepted, do nothing
    if (friendRequest.status === 'accepted') {
      return res.status(400).json({ message: 'Friend request already accepted' });
    }

    // Accept the request
    friendRequest.status = 'accepted';
    await friendRequest.save();

    // Add both users as friends
    const sender = await User.findById(friendRequest.sender);
    const receiver = await User.findById(friendRequest.receiver);

    sender.friends.push(receiver._id);
    receiver.friends.push(sender._id);

    await sender.save();
    await receiver.save();

    return res.status(200).json({ message: 'Friend request accepted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Reject a friend request
router.post('/reject', async (req, res) => {
  const { requestId } = req.body;

  try {
    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    // If the status is already rejected, do nothing
    if (friendRequest.status === 'rejected') {
      return res.status(400).json({ message: 'Friend request already rejected' });
    }

    // Reject the request
    friendRequest.status = 'rejected';
    await friendRequest.save();

    return res.status(200).json({ message: 'Friend request rejected' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get all friend requests for a user
router.get('/requests/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const requests = await FriendRequest.find({ receiver: userId }).populate('sender', 'name email');
    return res.status(200).json(requests);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
