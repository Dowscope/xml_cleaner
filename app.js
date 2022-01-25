// OnSIS XML Cleaner
// Created By: Tim Dowling

// Required Files
const xmljs = require('xml-js')
const fs = require('fs')

// Where the file is located and filename.
const school_bsid = '530344'
const onsis_period = 'OCTELEM3_20211031_'
const fileLoc = '/home/smooth/Work/OnSIS/batch/'
const file_name = 'ONSIS_' + onsis_period + school_bsid + '.xml' 
const filePath = fileLoc + file_name

// Open the file
fs.readFile(filePath, 'utf-8', (err, data)=> {
  if (err) return
  
  // Convert the XML file to JSON for easier access
  const xmlData = xmljs.xml2json(data, {compact: true,spaces: 2})
  const jsonData = JSON.parse(xmlData)

  // Grab all the students
  const students = jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT

  // Set the variables for re-creating the filename
  const report_year = jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.ACADEMIC_YEAR._text
  const report_period = jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SUBMISSION_PERIOD_TYPE._text
  const school_number = jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.SCHOOL_NUMBER._text
  const fileName = fileLoc + report_year + "_" + report_period + "_" + school_number + ".xml"

  // Count how many records are being changed
  var exception_counter = 0
  var iprc_date_counter = 0
  var placement_type_counter = 0
  var enrollment_end_date_counter = 0

  // Loop through the students
  for (s in students){

    
    // Get all the keys in the Student enrollemnt sections
    for (key in students[s].STUDENT_SCHOOL_ENROLMENT){
      
      // make sure that dates before July are corrected to July 1st.
      if (key == 'ENROLMENT_END_DATE') {
        if (Object.keys(students[s].STUDENT_SCHOOL_ENROLMENT.ENROLMENT_END_DATE).length > 0){
          if (new Date(students[s].STUDENT_SCHOOL_ENROLMENT.ENROLMENT_END_DATE._text) < new Date('2021/07/01')){
            jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT[s].STUDENT_SCHOOL_ENROLMENT.ENROLMENT_END_DATE._text = '2021/07/01'
            enrollment_end_date_counter += 1
          }
        }
      }

      // Find the Special Education section
      if (key == 'SPECIAL_EDUCATION'){

        // If student has a certain type NONEXC then lets change it
        if (students[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION.EXCEPTIONALITY_TYPE._text == 'NONEXC'){
          jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION.EXCEPTIONALITY_TYPE._text = ''
          jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION.NON_IDENTIFIED_STUDENT_FLAG._text = 'T'
          jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION.MAIN_EXCEPTIONALITY_FLAG._text = 'F'
          jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION.IPRC_STUDENT_FLAG._text = 'F'
          jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION.IPRC_REVIEW_DATE = {}
          
          // Update the exception_counter
          exception_counter += 1  
        }

        // Change in IPRC Date when blank
        if (students[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION.IPRC_STUDENT_FLAG._text == 'T' && Object.keys(students[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION.IPRC_REVIEW_DATE).length == 0){
          jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION.IPRC_REVIEW_DATE = students[s].STUDENT_SCHOOL_ENROLMENT.ENROLMENT_START_DATE
          iprc_date_counter += 1
        }

        // Change when placement type is blank
        if (Object.keys(students[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION.SPECIAL_EDU_PLMNT_TYPE).length == 0){
          jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION.SPECIAL_EDU_PLMNT_TYPE['_text'] = 'I'
          placement_type_counter += 1
        }
      }
    }
  }

  // Display the number of records that were changed
  console.log('NONEXC Records Changed: ' + exception_counter)
  console.log('IPRC DATE Records Changed: ' + iprc_date_counter)
  console.log('Placement Type Records Changed: ' + placement_type_counter)
  console.log('Enrollment End Dates Fixed: ' + enrollment_end_date_counter)

  // Convert the JSON to a string 
  jsonStr = JSON.stringify(jsonData)

  // Convert the JSON back to XML
  const xmlData2 = xmljs.json2xml(jsonStr, {compact: true,spaces: 2})

  // Create the file and save.
  fs.writeFile(fileName, xmlData2, 'utf-8', (err) => {
    console.log('Successful! ' + err)
  })
})