import Timesheet from '../models/timeSheet.js';
// Create a new timesheet entry
export const submitTimesheet = async (req, res) => {
  try {
    const { project, data } = req.body;

    const timesheet = await Timesheet.create({
      user: req.user._id,
      project,
      data
    });

    res.status(201).json(timesheet);
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit timesheet', error: err.message });
  }
};

 // get time sheets for a specific project
export const getTimesheetsByProject = async (req, res) => {
  try {
    const { id } = req.params;

    let query = { project: id };

   

    const timesheets = await Timesheet.find(query).populate('user', 'name email');

    res.json(timesheets);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch project timesheets', error: err.message });
  }
};

// ✅ Admin only: Update timesheet
export const updateTimesheet = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }

    const { id } = req.params;
    const { data } = req.body;

    const updatedTimesheet = await Timesheet.findByIdAndUpdate(
      id,
      { data },
      { new: true }
    );

    if (!updatedTimesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    res.json({ message: 'Timesheet updated successfully', timesheet: updatedTimesheet });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update timesheet', error: err.message });
  }
};

// ✅ Admin only: Delete timesheet
export const deleteTimesheet = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }

    const { id } = req.params;

    const deleted = await Timesheet.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    res.json({ message: 'Timesheet deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete timesheet', error: err.message });
  }
};
