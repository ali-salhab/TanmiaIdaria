import Permission from "../models/Permission.js";
import PermissionGroup from "../models/PermissionGroup.js";
import User from "../models/User.js";

export const getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ category: 1, label: 1 });
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPermission = async (req, res) => {
  try {
    const { key, label, description, category } = req.body;

    const existing = await Permission.findOne({ key });
    if (existing) {
      return res.status(400).json({ message: "Permission key already exists" });
    }

    const permission = new Permission({
      key,
      label,
      description,
      category,
    });

    await permission.save();
    res.status(201).json(permission);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllGroups = async (req, res) => {
  try {
    const groups = await PermissionGroup.find()
      .populate("permissions")
      .populate("members", "-password")
      .populate("createdBy", "-password");
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createGroup = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    const existing = await PermissionGroup.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Group name already exists" });
    }

    const group = new PermissionGroup({
      name,
      description,
      permissions: permissions || [],
      createdBy: req.user._id,
    });

    await group.save();
    await group.populate("permissions");
    res.status(201).json(group);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    const group = await PermissionGroup.findById(id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (permissions) group.permissions = permissions;

    await group.save();
    await group.populate("permissions");
    res.json(group);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;

    await PermissionGroup.findByIdAndDelete(id);
    await User.updateMany({}, { $pull: { permissionGroups: id } });

    res.json({ message: "Group deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addUserToGroup = async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    const group = await PermissionGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }

    if (!user.permissionGroups.includes(groupId)) {
      user.permissionGroups.push(groupId);
      await user.save();
    }

    await group.populate("permissions").populate("members", "-password");
    res.json(group);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const removeUserFromGroup = async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    const group = await PermissionGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    group.members = group.members.filter((id) => id.toString() !== userId);
    await group.save();

    const user = await User.findById(userId);
    if (user) {
      user.permissionGroups = user.permissionGroups.filter(
        (id) => id.toString() !== groupId
      );
      await user.save();
    }

    await group.populate("permissions").populate("members", "-password");
    res.json(group);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissions, directPermissions } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (permissions) {
      user.permissions = { ...user.permissions, ...permissions };
    }

    if (directPermissions) {
      user.directPermissions = directPermissions;
    }

    await user.save();
    await user.populate("permissionGroups").populate("directPermissions");

    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate("permissionGroups", "permissions")
      .populate("directPermissions");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const allPermissions = {
      ...user.permissions,
    };

    const allPermissionIds = new Set();
    user.permissionGroups.forEach((group) => {
      group.permissions.forEach((perm) => {
        allPermissionIds.add(perm._id.toString());
      });
    });

    user.directPermissions.forEach((perm) => {
      allPermissionIds.add(perm._id.toString());
    });

    res.json({
      user,
      allPermissions,
      permissionIds: Array.from(allPermissionIds),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
