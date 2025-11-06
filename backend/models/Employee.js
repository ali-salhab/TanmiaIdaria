import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    selfNumber: String,
    firstName: String, // الاسم الأول
    fatherName: String, // اسم الأب
    lastName: String, // الكنية
    fullName: String, // الاسم الثلاثي
    motherNameAndLastName: String, // اسم الأم والكنية
    nationalId: String, // الرقم الوطني
    nationality: String,
    governorate: String,
    city: String, // المنطقة - المدينة
    district: String, // الناحية
    birthPlace: String, // محل الولادة
    birthDate: Date,
    registrationNumber: String, // القيد
    gender: String,
    phone: String,
    maritalStatus: String,
    wivesCount: Number,
    childrenCount: Number,
    level1: String,
    level2: String,
    level3: String,
    level4: String,
    level5: String,
    level6: String,
    currentJobTitle: String,
    employmentType: String, // مثبت-متعاقد
    status: String,
    hiringDate: Date,
    contractType: String,
    contractDetails: String,
    jobCategory: String,
    educationLevel: String,
    specialization: String,
    residenceGovernorate: String,
    residenceCity: String,
    housingType: String,
    spouseIsEmployee: Boolean,
    spouseFullName: String,
    spouseWorkplace: String,
    healthStatus: String,
    illnessDetails: String,
    bloodType: String,
    degreeType: String,
    documentAvailable: Boolean,
    university: String,
    faculty: String,
    specialization2: String,
    graduationYear: String,
    managementDegree: Boolean,
    notes: String,
    workLocation: String,
    onStaff: Boolean,
    lastSalary: Number,
    documents: [
      {
        path: { type: String, required: true },
        description: { type: String, default: "" },
      },
    ],
    incidents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Incident",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Employee", employeeSchema);
