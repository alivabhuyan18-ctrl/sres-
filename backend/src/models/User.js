import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    identifier: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["student", "faculty", "admin"], required: true },
    department: { type: String, default: "Computer Science" },
    designation: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    semester: { type: Number, default: 1 },
    avatar: { type: String, default: "" },
    applicationNo: { type: String, default: "" },
    rank: { type: String, default: "" },
    admissionStatus: { type: String, default: "" },
    joiningYear: { type: String, default: "" },
    programme: { type: String, default: "" },
    programmeType: { type: String, default: "" },
    branch: { type: String, default: "" },
    allotmentDetails: {
      batch: { type: String, default: "" },
      joiningYear: { type: String, default: "" },
      admissionDate: { type: String, default: "" },
      admissionType: { type: String, default: "" },
      feeType: { type: String, default: "" },
      isTfw: { type: String, default: "" },
      isPc: { type: String, default: "" },
      seatCategory: { type: String, default: "" },
      category: { type: String, default: "" },
      caste: { type: String, default: "" },
      ojeeRank: { type: String, default: "" },
      isLateral: { type: String, default: "" },
      hostelWillingness: { type: String, default: "" },
      hostelAllocated: { type: String, default: "" },
      hostelName: { type: String, default: "" },
      interestedInternalSliding: { type: String, default: "" }
    },
    personalDetails: {
      dob: { type: String, default: "" },
      gender: { type: String, default: "" },
      fatherName: { type: String, default: "" },
      fatherOccupation: { type: String, default: "" },
      fatherAadhar: { type: String, default: "" },
      motherName: { type: String, default: "" },
      motherOccupation: { type: String, default: "" },
      motherAadhar: { type: String, default: "" },
      annualIncome: { type: String, default: "" },
      bloodGroup: { type: String, default: "" },
      motherTongue: { type: String, default: "" },
      religion: { type: String, default: "" },
      nationality: { type: String, default: "" },
      country: { type: String, default: "" },
      aadharNo: { type: String, default: "" },
      moleOrSimilar: { type: String, default: "" },
      accountNo: { type: String, default: "" },
      bankName: { type: String, default: "" },
      bankBranch: { type: String, default: "" },
      ifscCode: { type: String, default: "" }
    },
    communicationDetails: {
      landline: { type: String, default: "" },
      parentMobile: { type: String, default: "" },
      studentMobileWhatsapp: { type: String, default: "" },
      studentEmail: { type: String, default: "" },
      parentEmail: { type: String, default: "" },
      correspondenceGuardian: { type: String, default: "" },
      correspondenceDoorNo: { type: String, default: "" },
      correspondenceStreet: { type: String, default: "" },
      correspondenceVillageCity: { type: String, default: "" },
      correspondenceState: { type: String, default: "" },
      correspondenceDistrict: { type: String, default: "" },
      correspondencePinCode: { type: String, default: "" },
      correspondenceCombined: { type: String, default: "" },
      permanentGuardian: { type: String, default: "" },
      permanentDoorNo: { type: String, default: "" },
      permanentStreet: { type: String, default: "" },
      permanentVillageCity: { type: String, default: "" },
      permanentState: { type: String, default: "" },
      permanentDistrict: { type: String, default: "" },
      permanentPinCode: { type: String, default: "" },
      permanentCombined: { type: String, default: "" }
    },
    qualificationDetails: [
      {
        qualification: String,
        institution: String,
        boardUniversity: String,
        passingYear: String,
        maxMarks: String,
        marksSecured: String,
        gradePercentage: String,
        marksheetCertificate: String,
        marksheetCertificateData: String,
        verificationStatus: { type: String, enum: ["Not Uploaded", "Pending", "Verified", "Rejected"], default: "Not Uploaded" },
        verificationRemark: { type: String, default: "" }
      }
    ],
    certificates: [
      {
        certificate: String,
        file: String,
        fileData: String,
        verificationStatus: { type: String, enum: ["Not Uploaded", "Pending", "Verified", "Rejected"], default: "Not Uploaded" },
        verificationRemark: { type: String, default: "" }
      }
    ],
    advisor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
