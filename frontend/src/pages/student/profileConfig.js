export const getNestedValue = (source, path) => path.split(".").reduce((value, key) => value?.[key], source) || "";

export const setNestedValue = (source, path, value) => {
  const keys = path.split(".");
  const next = { ...source };
  let current = next;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      current[key] = value;
      return;
    }
    current[key] = { ...(current[key] || {}) };
    current = current[key];
  });
  return next;
};

const requiredPaths = new Set([
  "identifier",
  "applicationNo",
  "name",
  "admissionStatus",
  "joiningYear",
  "semester",
  "programme",
  "programmeType",
  "branch",
  "allotmentDetails.batch",
  "allotmentDetails.admissionType",
  "allotmentDetails.feeType",
  "allotmentDetails.seatCategory",
  "allotmentDetails.category",
  "allotmentDetails.entranceExam",
  "allotmentDetails.entranceRank",
  "personalDetails.dob",
  "personalDetails.gender",
  "personalDetails.fatherName",
  "personalDetails.motherName",
  "personalDetails.bloodGroup",
  "personalDetails.nationality",
  "personalDetails.aadharNo",
  "communicationDetails.parentMobile",
  "communicationDetails.studentMobileWhatsapp",
  "communicationDetails.studentEmail",
  "communicationDetails.correspondenceGuardian",
  "communicationDetails.correspondenceDoorNo",
  "communicationDetails.correspondenceStreet",
  "communicationDetails.correspondenceVillageCity",
  "communicationDetails.correspondenceState",
  "communicationDetails.correspondenceDistrict",
  "communicationDetails.correspondencePinCode",
  "communicationDetails.permanentGuardian",
  "communicationDetails.permanentDoorNo",
  "communicationDetails.permanentStreet",
  "communicationDetails.permanentVillageCity",
  "communicationDetails.permanentState",
  "communicationDetails.permanentDistrict",
  "communicationDetails.permanentPinCode"
]);

const markRequired = (fields) => fields.map((field) => ({ ...field, required: requiredPaths.has(field.path) }));
const markGroupFields = (groups) => groups.map((group) => ({ ...group, fields: markRequired(group.fields) }));
export const isFieldRequired = (path) => requiredPaths.has(path);

export const basicFields = markRequired([
  { label: "Registration No.", path: "identifier" },
  { label: "Application No.", path: "applicationNo" },
  { label: "Name", path: "name" },
  { label: "Rank", path: "rank" },
  { label: "Admission Status", path: "admissionStatus" },
  { label: "Joining Year", path: "joiningYear" },
  { label: "Semester", path: "semester" },
  { label: "Programme", path: "programme" },
  { label: "Programme Type", path: "programmeType" },
  { label: "Branch", path: "branch" }
]);

export const allotmentFields = markRequired([
  { label: "Batch", path: "allotmentDetails.batch" },
  { label: "Joining Year", path: "allotmentDetails.joiningYear" },
  { label: "Admission Dt.", path: "allotmentDetails.admissionDate" },
  { label: "Admission Type", path: "allotmentDetails.admissionType" },
  { label: "Fee Type", path: "allotmentDetails.feeType" },
  { label: "Is TFW", path: "allotmentDetails.isTfw" },
  { label: "Is PC", path: "allotmentDetails.isPc" },
  { label: "Seat Category", path: "allotmentDetails.seatCategory" },
  { label: "Category", path: "allotmentDetails.category" },
  { label: "Caste", path: "allotmentDetails.caste" },
  { label: "Entrance Exam", path: "allotmentDetails.entranceExam" },
  { label: "Entrance Rank", path: "allotmentDetails.entranceRank" },
  { label: "Is Lateral", path: "allotmentDetails.isLateral" },
  { label: "Hostel Willingness", path: "allotmentDetails.hostelWillingness" },
  { label: "Hostel Allocated", path: "allotmentDetails.hostelAllocated" },
  { label: "Hostel Name", path: "allotmentDetails.hostelName" },
  { label: "Interested in Internal Sliding", path: "allotmentDetails.interestedInternalSliding" }
]);

export const personalFields = markRequired([
  { label: "DOB", path: "personalDetails.dob" },
  { label: "Gender", path: "personalDetails.gender" },
  { label: "Father Name", path: "personalDetails.fatherName" },
  { label: "Father Occupation", path: "personalDetails.fatherOccupation" },
  { label: "Father Aadhar", path: "personalDetails.fatherAadhar" },
  { label: "Mother Name", path: "personalDetails.motherName" },
  { label: "Mother Occupation", path: "personalDetails.motherOccupation" },
  { label: "Mother Aadhar", path: "personalDetails.motherAadhar" },
  { label: "Annual Income", path: "personalDetails.annualIncome" },
  { label: "Blood Group", path: "personalDetails.bloodGroup" },
  { label: "Mother Tongue", path: "personalDetails.motherTongue" },
  { label: "Religion", path: "personalDetails.religion" },
  { label: "Nationality", path: "personalDetails.nationality" },
  { label: "Country", path: "personalDetails.country" },
  { label: "Aadhar No.", path: "personalDetails.aadharNo" },
  { label: "Mole or Similar", path: "personalDetails.moleOrSimilar" },
  { label: "Account No.", path: "personalDetails.accountNo" },
  { label: "Bank Name", path: "personalDetails.bankName" },
  { label: "Bank Branch", path: "personalDetails.bankBranch" },
  { label: "IFSC Code", path: "personalDetails.ifscCode" }
]);

export const communicationFields = markRequired([
  { label: "Landline", path: "communicationDetails.landline" },
  { label: "Parent Mobile", path: "communicationDetails.parentMobile" },
  { label: "Student Mobile WhatsApp", path: "communicationDetails.studentMobileWhatsapp" },
  { label: "Student Email", path: "communicationDetails.studentEmail" },
  { label: "Parent Email", path: "communicationDetails.parentEmail" },
  { label: "Correspondence Guardian", path: "communicationDetails.correspondenceGuardian" },
  { label: "Correspondence Door No.", path: "communicationDetails.correspondenceDoorNo" },
  { label: "Correspondence Street", path: "communicationDetails.correspondenceStreet" },
  { label: "Correspondence Village/City", path: "communicationDetails.correspondenceVillageCity" },
  { label: "Correspondence State", path: "communicationDetails.correspondenceState" },
  { label: "Correspondence District", path: "communicationDetails.correspondenceDistrict" },
  { label: "Correspondence Pin Code", path: "communicationDetails.correspondencePinCode" },
  { label: "Permanent Guardian", path: "communicationDetails.permanentGuardian" },
  { label: "Permanent Door No.", path: "communicationDetails.permanentDoorNo" },
  { label: "Permanent Street", path: "communicationDetails.permanentStreet" },
  { label: "Permanent Village/City", path: "communicationDetails.permanentVillageCity" },
  { label: "Permanent State", path: "communicationDetails.permanentState" },
  { label: "Permanent District", path: "communicationDetails.permanentDistrict" },
  { label: "Permanent Pin Code", path: "communicationDetails.permanentPinCode" }
]);

export const allotmentGroups = markGroupFields([
  {
    title: "Admission Information",
    fields: [
      { label: "Batch", path: "allotmentDetails.batch" },
      { label: "Joining Year", path: "allotmentDetails.joiningYear" },
      { label: "Admission Dt.", path: "allotmentDetails.admissionDate" },
      { label: "Admission Type", path: "allotmentDetails.admissionType" },
      { label: "Fee Type", path: "allotmentDetails.feeType" }
    ]
  },
  {
    title: "Seat and Category",
    fields: [
      { label: "Is TFW", path: "allotmentDetails.isTfw" },
      { label: "Is PC", path: "allotmentDetails.isPc" },
      { label: "Seat Category", path: "allotmentDetails.seatCategory" },
      { label: "Category", path: "allotmentDetails.category" },
      { label: "Caste", path: "allotmentDetails.caste" },
      { label: "Entrance Exam", path: "allotmentDetails.entranceExam" },
      { label: "Entrance Rank", path: "allotmentDetails.entranceRank" },
      { label: "Is Lateral", path: "allotmentDetails.isLateral" }
    ]
  },
  {
    title: "Hostel and Sliding",
    fields: [
      { label: "Hostel Willingness", path: "allotmentDetails.hostelWillingness" },
      { label: "Hostel Allocated", path: "allotmentDetails.hostelAllocated" },
      { label: "Hostel Name", path: "allotmentDetails.hostelName" },
      { label: "Interested in Internal Sliding", path: "allotmentDetails.interestedInternalSliding" }
    ]
  }
]);

export const personalGroups = markGroupFields([
  {
    title: "Student Identity",
    fields: [
      { label: "DOB", path: "personalDetails.dob" },
      { label: "Gender", path: "personalDetails.gender" },
      { label: "Blood Group", path: "personalDetails.bloodGroup" },
      { label: "Mother Tongue", path: "personalDetails.motherTongue" },
      { label: "Religion", path: "personalDetails.religion" },
      { label: "Nationality", path: "personalDetails.nationality" },
      { label: "Country", path: "personalDetails.country" }
    ]
  },
  {
    title: "Parent Details",
    fields: [
      { label: "Father Name", path: "personalDetails.fatherName" },
      { label: "Father Occupation", path: "personalDetails.fatherOccupation" },
      { label: "Father Aadhar", path: "personalDetails.fatherAadhar" },
      { label: "Mother Name", path: "personalDetails.motherName" },
      { label: "Mother Occupation", path: "personalDetails.motherOccupation" },
      { label: "Mother Aadhar", path: "personalDetails.motherAadhar" },
      { label: "Annual Income", path: "personalDetails.annualIncome" }
    ]
  },
  {
    title: "Identification Details",
    fields: [
      { label: "Aadhar No.", path: "personalDetails.aadharNo" },
      { label: "Mole or Similar", path: "personalDetails.moleOrSimilar" }
    ]
  },
  {
    title: "Bank Details",
    fields: [
      { label: "Account No.", path: "personalDetails.accountNo" },
      { label: "Bank Name", path: "personalDetails.bankName" },
      { label: "Bank Branch", path: "personalDetails.bankBranch" },
      { label: "IFSC Code", path: "personalDetails.ifscCode" }
    ]
  }
]);

export const communicationGroups = markGroupFields([
  {
    title: "Contact Details",
    fields: [
      { label: "Landline", path: "communicationDetails.landline" },
      { label: "Parent Mobile", path: "communicationDetails.parentMobile" },
      { label: "Student Mobile WhatsApp", path: "communicationDetails.studentMobileWhatsapp" },
      { label: "Student Email", path: "communicationDetails.studentEmail" },
      { label: "Parent Email", path: "communicationDetails.parentEmail" }
    ]
  },
  {
    title: "Correspondence Address",
    fields: [
      { label: "Guardian", path: "communicationDetails.correspondenceGuardian" },
      { label: "Door No.", path: "communicationDetails.correspondenceDoorNo" },
      { label: "Street", path: "communicationDetails.correspondenceStreet" },
      { label: "Village/City", path: "communicationDetails.correspondenceVillageCity" },
      { label: "State", path: "communicationDetails.correspondenceState" },
      { label: "District", path: "communicationDetails.correspondenceDistrict" },
      { label: "Pin Code", path: "communicationDetails.correspondencePinCode" }
    ]
  },
  {
    title: "Permanent Address",
    fields: [
      { label: "Guardian", path: "communicationDetails.permanentGuardian" },
      { label: "Door No.", path: "communicationDetails.permanentDoorNo" },
      { label: "Street", path: "communicationDetails.permanentStreet" },
      { label: "Village/City", path: "communicationDetails.permanentVillageCity" },
      { label: "State", path: "communicationDetails.permanentState" },
      { label: "District", path: "communicationDetails.permanentDistrict" },
      { label: "Pin Code", path: "communicationDetails.permanentPinCode" }
    ]
  }
]);

export const completionPaths = [...requiredPaths];

export const getMissingRequiredFields = (fields, form) =>
  fields.filter((field) => field.required && !String(getNestedValue(form, field.path)).trim());

export const sectionStatus = (fields, form) => {
  const requiredFields = fields.filter((field) => field.required);
  const fieldsToCheck = requiredFields.length ? requiredFields : fields;
  return fieldsToCheck.every((field) => Boolean(String(getNestedValue(form, field.path)).trim())) ? "Complete" : "Incomplete";
};

export const profileCompletion = (form) => {
  const filled = completionPaths.filter((path) => Boolean(getNestedValue(form, path))).length;
  return Math.round((filled / completionPaths.length) * 100);
};

export const documentSummary = (form) => {
  const docs = [
    ...(form.qualificationDetails || []).map((item) => item.verificationStatus || "Not Uploaded"),
    ...(form.certificates || []).map((item) => item.verificationStatus || "Not Uploaded")
  ];
  return {
    total: docs.length,
    verified: docs.filter((status) => status === "Verified").length,
    pending: docs.filter((status) => status === "Pending").length,
    rejected: docs.filter((status) => status === "Rejected").length
  };
};
