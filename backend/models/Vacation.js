import mongoose from "mongoose";

const vacationSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "إجازة صحية",
        "إجازة أمومة",
        "إجازة ساعية",
        "إجازة إدارية",
        "إجازة خاصة بلا أجر",
        "إجازة زواج",
        "إجازة حج",
      ],
      required: true,
    },
    days: { type: Number, required: false }, // calculated or manual
    hours: { type: Number, required: false },
    childOrder: { type: Number, required: false }, // for maternity leave
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Vacation", vacationSchema);
