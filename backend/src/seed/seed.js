import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Attendance from "../models/Attendance.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Notification from "../models/Notification.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";

dotenv.config();

const run = async () => {
  await connectDB();
  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    Enrollment.deleteMany({}),
    Attendance.deleteMany({}),
    Payment.deleteMany({}),
    Notification.deleteMany({})
  ]);

  const [student, studentTwo, faculty, admin] = await User.create([
    {
      name: "Aarav Mishra",
      identifier: "REG2024001",
      applicationNo: "APP202400128",
      rank: "OJEE-1532",
      admissionStatus: "Admitted",
      email: "aarav@student.edu",
      password: "password123",
      role: "student",
      semester: 3,
      joiningYear: "2024",
      programme: "B.Tech",
      programmeType: "Regular",
      branch: "Computer Science and Engineering",
      department: "Computer Science",
      phone: "9876543210",
      address: "Bhubaneswar",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
      allotmentDetails: {
        batch: "2024-2028",
        joiningYear: "2024",
        admissionDate: "2024-08-12",
        admissionType: "OJEE Counselling",
        feeType: "Regular",
        isTfw: "No",
        isPc: "No",
        seatCategory: "General",
        category: "UR",
        caste: "General",
        ojeeRank: "1532",
        isLateral: "No",
        hostelWillingness: "Yes",
        hostelAllocated: "Yes",
        hostelName: "Boys Hostel - A",
        interestedInternalSliding: "No"
      },
      personalDetails: {
        dob: "2006-04-18",
        gender: "Male",
        fatherName: "Rakesh Mishra",
        fatherOccupation: "Teacher",
        fatherAadhar: "XXXX-XXXX-2381",
        motherName: "Anita Mishra",
        motherOccupation: "Homemaker",
        motherAadhar: "XXXX-XXXX-8742",
        annualIncome: "INR 6,20,000",
        bloodGroup: "B+",
        motherTongue: "Odia",
        religion: "Hindu",
        nationality: "Indian",
        country: "India",
        aadharNo: "XXXX-XXXX-5138",
        moleOrSimilar: "Mole on left wrist",
        accountNo: "XXXXXXXX4216",
        bankName: "State Bank of India",
        bankBranch: "Bhubaneswar Main",
        ifscCode: "SBIN0000041"
      },
      communicationDetails: {
        landline: "0674-2451100",
        parentMobile: "9437001122",
        studentMobileWhatsapp: "9876543210",
        studentEmail: "aarav@student.edu",
        parentEmail: "rakesh.mishra@example.com",
        correspondenceGuardian: "Rakesh Mishra",
        correspondenceDoorNo: "Plot 14",
        correspondenceStreet: "Sahid Nagar",
        correspondenceVillageCity: "Bhubaneswar",
        correspondenceState: "Odisha",
        correspondenceDistrict: "Khordha",
        correspondencePinCode: "751007",
        correspondenceCombined: "Plot 14, Sahid Nagar, Bhubaneswar, Odisha - 751007",
        permanentGuardian: "Rakesh Mishra",
        permanentDoorNo: "Plot 14",
        permanentStreet: "Sahid Nagar",
        permanentVillageCity: "Bhubaneswar",
        permanentState: "Odisha",
        permanentDistrict: "Khordha",
        permanentPinCode: "751007",
        permanentCombined: "Plot 14, Sahid Nagar, Bhubaneswar, Odisha - 751007"
      },
      qualificationDetails: [
        { qualification: "10th", institution: "DAV Public School", boardUniversity: "CBSE", passingYear: "2022", maxMarks: "500", marksSecured: "456", gradePercentage: "91.2%", marksheetCertificate: "10th-marksheet.pdf", verificationStatus: "Verified" },
        { qualification: "12th", institution: "BJB Higher Secondary School", boardUniversity: "CHSE Odisha", passingYear: "2024", maxMarks: "600", marksSecured: "522", gradePercentage: "87.0%", marksheetCertificate: "12th-marksheet.pdf", verificationStatus: "Pending" }
      ],
      certificates: [
        { certificate: "Caste Certificate", file: "Not Applicable", verificationStatus: "Not Uploaded" },
        { certificate: "Income Certificate", file: "income-certificate.pdf", verificationStatus: "Pending" },
        { certificate: "Migration Certificate", file: "migration-certificate.pdf", verificationStatus: "Verified" }
      ]
    },
    { name: "Nisha Rao", identifier: "REG2024002", email: "nisha@student.edu", password: "password123", role: "student", semester: 3, phone: "9876501234", address: "Cuttack", avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=256&q=80" },
    { name: "Dr. Kavita Sen", identifier: "EMP1001", email: "kavita@faculty.edu", password: "password123", role: "faculty", designation: "HOD / Advisor" },
    { name: "System Admin", identifier: "ADM001", email: "admin@erp.edu", password: "admin123", role: "admin", designation: "Registrar Office" }
  ]);

  const [dsa, dbms, os, cn, se, maths, dsaLab, dbmsLab, webLab, ai] = await Course.create([
    { code: "CS201", name: "Data Structures", credits: 4, capacity: 60, semester: 3, instructor: faculty._id },
    { code: "CS203", name: "Database Management Systems", credits: 4, capacity: 55, semester: 3, instructor: faculty._id },
    { code: "CS205", name: "Operating Systems", credits: 4, capacity: 60, semester: 3, instructor: faculty._id },
    { code: "CS207", name: "Computer Networks", credits: 3, capacity: 60, semester: 3, instructor: faculty._id },
    { code: "CS209", name: "Software Engineering", credits: 3, capacity: 55, semester: 3, instructor: faculty._id },
    { code: "MA201", name: "Discrete Mathematics", credits: 3, capacity: 70, semester: 3, instructor: faculty._id },
    { code: "CS251", name: "Data Structures Lab", credits: 2, capacity: 30, semester: 3, instructor: faculty._id },
    { code: "CS253", name: "DBMS Lab", credits: 2, capacity: 30, semester: 3, instructor: faculty._id },
    { code: "CS255", name: "Web Technology Lab", credits: 2, capacity: 30, semester: 3, instructor: faculty._id },
    { code: "CS305", name: "Artificial Intelligence", credits: 3, capacity: 45, semester: 5, instructor: faculty._id }
  ]);
  ai.prerequisites = [dsa._id];
  await ai.save();

  await Enrollment.create([
    { student: student._id, course: dsa._id, status: "approved", approvedBy: faculty._id, approvedAt: new Date() },
    { student: student._id, course: dbms._id, status: "approved", approvedBy: faculty._id, approvedAt: new Date() },
    { student: student._id, course: os._id, status: "approved", approvedBy: faculty._id, approvedAt: new Date() },
    { student: student._id, course: cn._id, status: "approved", approvedBy: faculty._id, approvedAt: new Date() },
    { student: student._id, course: se._id, status: "approved", approvedBy: faculty._id, approvedAt: new Date() },
    { student: student._id, course: maths._id, status: "approved", approvedBy: faculty._id, approvedAt: new Date() },
    { student: student._id, course: dsaLab._id, status: "approved", approvedBy: faculty._id, approvedAt: new Date() },
    { student: student._id, course: dbmsLab._id, status: "approved", approvedBy: faculty._id, approvedAt: new Date() },
    { student: student._id, course: webLab._id, status: "approved", approvedBy: faculty._id, approvedAt: new Date() },
    { student: studentTwo._id, course: cn._id, status: "pending" }
  ]);

  await Attendance.create([
    { student: student._id, course: dsa._id, totalClasses: 42, attendedClasses: 38 },
    { student: student._id, course: dbms._id, totalClasses: 36, attendedClasses: 29 },
    { student: student._id, course: os._id, totalClasses: 40, attendedClasses: 34 },
    { student: student._id, course: cn._id, totalClasses: 38, attendedClasses: 31 },
    { student: student._id, course: se._id, totalClasses: 35, attendedClasses: 30 },
    { student: student._id, course: maths._id, totalClasses: 44, attendedClasses: 39 },
    { student: student._id, course: dsaLab._id, totalClasses: 22, attendedClasses: 21 },
    { student: student._id, course: dbmsLab._id, totalClasses: 20, attendedClasses: 18 },
    { student: student._id, course: webLab._id, totalClasses: 24, attendedClasses: 20 }
  ]);

  await Payment.create([
    { student: student._id, type: "semester", amount: 42000, status: "paid", reference: "TXN-S-1001", paidAt: new Date() },
    { student: student._id, type: "hostel", amount: 18000, status: "pending", reference: "TXN-H-1008" },
    { student: student._id, type: "library", amount: 750, status: "paid", reference: "TXN-L-1020", paidAt: new Date() }
  ]);

  await Notification.create([
    { title: "Semester registration open", message: "Complete your course selections before Friday 5 PM.", audience: "student", createdBy: admin._id },
    { title: "Approval queue updated", message: "New enrollment requests are waiting for advisor review.", audience: "faculty", createdBy: admin._id }
  ]);

  console.log("Seed complete");
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
