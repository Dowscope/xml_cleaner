// OnSIS XML Cleaner
// Created By: Tim Dowling

// Required Files
const xmljs = require('xml-js')
const fs = require('fs')

// School and Period Information
const school_bsid = '385131'
const onsis_p = 'OCTELEM3'     // OCTELEM3 - Elementary | OCTSEC1 - Secondary
const onsis_year = '_20211031_'
const onsis_period = onsis_p + onsis_year

// Where the file is located and filename.
const fileLoc = 'H:\\1-onsis\\batch\\'
const file_name = 'ONSIS_' + onsis_period + school_bsid + '.xml' 
const filePath = fileLoc + file_name

// Open the file
fs.readFile(filePath, 'utf-8', (err, data)=> {
  if (err) {
    console.log(err)
    return
  } 
    
  
  // Convert the XML file to JSON for easier access
  const xmlData = xmljs.xml2json(data, {compact: true,spaces: 2})
  const jsonData = JSON.parse(xmlData)

  // Grab all the students
  const students = jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT
  const educators = jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.SCHOOL_EDUCATOR_ASSIGNMENT

  // Set the variables for re-creating the filename
  const report_year = jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.ACADEMIC_YEAR._text
  const report_period = jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SUBMISSION_PERIOD_TYPE._text
  const school_number = jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.SCHOOL_NUMBER._text
  const fileName = fileLoc + report_year + "_" + report_period + "_" + school_number + ".xml"

  // If this is the October Submissionremove some tags. ** This may be a future issue **
  // if (onsis_p == 'OCTELEM3'){
  //   if (jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.CLEAR_AVG_REPORT_CARD_GRADE && Object.keys(jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.CLEAR_AVG_REPORT_CARD_GRADE).length > 0){
  //     delete jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.CLEAR_AVG_REPORT_CARD_GRADE
  //   }

  //   if (jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.CLEAR_MEDIAN_REPORT_CARD_GRADE && Object.keys(jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.CLEAR_MEDIAN_REPORT_CARD_GRADE).length > 0){
  //     delete jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.CLEAR_MEDIAN_REPORT_CARD_GRADE
  //   }

  //   if (jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.CLEAR_REPORT_CARD && Object.keys(jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.CLEAR_REPORT_CARD).length > 0){
  //     delete jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.CLEAR_REPORT_CARD
  //   }
  // }


  // Count how many records are being changed
  var exception_counter = 0
  var iprc_date_counter = 0
  var placement_type_counter = 0
  var enrollment_end_date_counter = 0
  var self_id_counter = 0
  var student_manual_counter = 0
  var second_language_counter = 0
  var educator_fix_counter = 0
  var educator_missing_men = 0

  // Loop through the students
  for (s in students){

    // Manual Changes Here
    // const student_fixes = ['359097382', '359104171', '359106341', '359116274', '359117751', '359117769', '359117842']

    // for (student_number in student_fixes){
    //   if (students[s].STUDENT_SCHOOL_ENROLMENT.SCHOOL_STUDENT_NUMBER._text == student_fixes[student_number]){
    //     jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT[s].STUDENT_SCHOOL_ENROLMENT.STUDENT_MOBILITY_TYPE._text = '38'
    //     student_manual_counter += 1
    //   }
    // }
    
    // Get all the keys in the Student enrollemnt sections

    if (students[s].STUDENT_SCHOOL_ENROLMENT.STU_BRD_RES_STAT_TYPE && Object.keys(students[s].STUDENT_SCHOOL_ENROLMENT.STU_BRD_RES_STAT_TYPE).length == 0){
      jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT[s].STUDENT_SCHOOL_ENROLMENT.STU_BRD_RES_STAT_TYPE._text = '01'
    }

    for (key in students[s].STUDENT_SCHOOL_ENROLMENT){
      
      // Correc the error that this should be blank.
      if (key == 'INDIGENOUS_SELF_IDENTIFICATION'){
        if (Object.keys(students[s].STUDENT_SCHOOL_ENROLMENT.INDIGENOUS_SELF_IDENTIFICATION).length > 0){
          if (students[s].STUDENT_SCHOOL_ENROLMENT.INDIGENOUS_SELF_IDENTIFICATION._text == 'Non'){
            jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT[s].STUDENT_SCHOOL_ENROLMENT.INDIGENOUS_SELF_IDENTIFICATION._text = ''
            self_id_counter += 1
          }
        }
      }

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
        if (Object.keys(students[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION).length != 8){
          for( sped in students[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION){

            
            // Change in IPRC Date when blank
            if (Object.keys(students[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION[sped].IPRC_STUDENT_FLAG).length > 0){
              if (students[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION[sped].IPRC_STUDENT_FLAG._text == 'T' && Object.keys(students[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION[sped].IPRC_REVIEW_DATE).length == 0){
                jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION[sped].IPRC_REVIEW_DATE = students[s].STUDENT_SCHOOL_ENROLMENT.ENROLMENT_START_DATE
                iprc_date_counter += 1
              }
            }
            
            // Change when placement type is blank
            if (students[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION[sped].SPECIAL_EDU_PLMNT_TYPE) {
              if (Object.keys(students[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION[sped].SPECIAL_EDU_PLMNT_TYPE).length == 0){
                jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION[sped].SPECIAL_EDU_PLMNT_TYPE._text = 'I'
                placement_type_counter += 1
              }
            }
  
            // If student has a certain type NONEXC or NONIND then lets change it
            if (Object.keys(students[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION[sped].EXCEPTIONALITY_TYPE).length >= 0){
              if (Object.keys(students[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION[sped].EXCEPTIONALITY_TYPE).length == 0){
                delete jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION[sped]
                delete students[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION[sped]

                // var tempArry = [];
                // for (let i of jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION) {
                //   i && tempArry.push(i);
                // }
                // jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION = tempArry;

                exception_counter += 1 
              }
              else if (students[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION[sped].EXCEPTIONALITY_TYPE._text == 'NONEXC' || students[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION[sped].EXCEPTIONALITY_TYPE._text == 'NONEID'){
                delete jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION[sped]
                delete students[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION[sped]
                
                // var tempArry = [];
                // for (let i of jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION) {
                //   i && tempArry.push(i);
                // }
                // jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION = tempArry;
                
                // Update the exception_counter
                exception_counter += 1  
              }
            }

          }

          var tempArry = [];
          for (let i of jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION) {
            i && tempArry.push(i);
          }
          jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION = tempArry;
        }
        else {
          // Change in IPRC Date when blank
          if (students[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION.IPRC_STUDENT_FLAG && Object.keys(students[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION.IPRC_STUDENT_FLAG).length > 0){
            if (students[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION.IPRC_STUDENT_FLAG._text == 'T' && Object.keys(students[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION.IPRC_REVIEW_DATE).length == 0){
              jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION.IPRC_REVIEW_DATE = students[s].STUDENT_SCHOOL_ENROLMENT.ENROLMENT_START_DATE
              iprc_date_counter += 1
            }
          }

          // Change when placement type is blank
          if (students[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION.SPECIAL_EDU_PLMNT_TYPE) {
            if (Object.keys(students[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION.SPECIAL_EDU_PLMNT_TYPE).length == 0){
              jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION.SPECIAL_EDU_PLMNT_TYPE._text = 'I'
              placement_type_counter += 1
            }
          }

          // If student has a certain type NONEXC then lets change it
          if (students[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION.EXCEPTIONALITY_TYPE && Object.keys(students[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION.EXCEPTIONALITY_TYPE).length > 0){
            if (students[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION.EXCEPTIONALITY_TYPE._text == 'NONEXC' || students[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION.EXCEPTIONALITY_TYPE._text == 'NONEID'){
              jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION.EXCEPTIONALITY_TYPE._text = ''
              jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION.NON_IDENTIFIED_STUDENT_FLAG._text = 'T'
              jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION.MAIN_EXCEPTIONALITY_FLAG._text = 'F'
              jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION.IPRC_STUDENT_FLAG._text = 'F'
              jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT[s].STUDENT_SCHOOL_ENROLMENT.SPECIAL_EDUCATION.IPRC_REVIEW_DATE = {}
              
              // Update the exception_counter
              exception_counter += 1  
            }
          }
        }
      }

      if (key == 'SECOND_LANGUAGE_PROGRAM') {
        if (Object.keys(students[s].STUDENT_SCHOOL_ENROLMENT.SECOND_LANGUAGE_PROGRAM).length = 3){
          if (students[s].STUDENT_SCHOOL_ENROLMENT.SECOND_LANGUAGE_PROGRAM.MINUTES_PER_DAY_OF_INSTRUCTION && students[s].STUDENT_SCHOOL_ENROLMENT.SECOND_LANGUAGE_PROGRAM.MINUTES_PER_DAY_OF_INSTRUCTION._text == '000.00') {
            jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT[s].STUDENT_SCHOOL_ENROLMENT.SECOND_LANGUAGE_PROGRAM.MINUTES_PER_DAY_OF_INSTRUCTION._text = '040.00'
            second_language_counter += 1
          }
        }else {
          for (sl in students[s].STUDENT_SCHOOL_ENROLMENT.SECOND_LANGUAGE_PROGRAM){
            if (students[s].STUDENT_SCHOOL_ENROLMENT.SECOND_LANGUAGE_PROGRAM[sl].MINUTES_PER_DAY_OF_INSTRUCTION && students[s].STUDENT_SCHOOL_ENROLMENT.SECOND_LANGUAGE_PROGRAM[sl].MINUTES_PER_DAY_OF_INSTRUCTION._text == '000.00') {
              jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.STUDENT[s].STUDENT_SCHOOL_ENROLMENT.SECOND_LANGUAGE_PROGRAM[sl].MINUTES_PER_DAY_OF_INSTRUCTION._text = '040.00'
              second_language_counter += 1
            }
          }
        }
      }
    }
  }

  for (e in educators) {
    let manual_fix = [
      '010878510',
      '013324496',
      '015573983',
      '029556685',
      '034922005',
      '040578981'
    ]
    
    for (i in manual_fix){
      if (educators[e].MEN._text == manual_fix[i]){
        jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.SCHOOL_EDUCATOR_ASSIGNMENT[e].ACTION._text = 'UPDATE'
        delete jsonData.ONSIS_BATCH_FILE.DATA.SCHOOL_SUBMISSION.SCHOOL.SCHOOL_EDUCATOR_ASSIGNMENT[e].ASSIGNMENT_START_DATE
        educator_fix_counter += 1
      }
    }

    if (!educators[e].MEN._text) {
      educator_missing_men += 1
    }
  }

  // Display the number of records that were changed
  console.log('School Numner: ' + school_bsid)
  console.log('NONEXC/NONEID Records Changed: ' + exception_counter)
  console.log('IPRC DATE Records Changed: ' + iprc_date_counter)
  console.log('Placement Type Records Changed: ' + placement_type_counter)
  console.log('Enrollment End Dates Fixed: ' + enrollment_end_date_counter)
  console.log('Self ID\'s changed: ' + self_id_counter)
  console.log('Student Manual Fixes: ' + student_manual_counter)
  console.log('Second Language Fixes: ' + second_language_counter)
  console.log('Educator Action Changes: ' + educator_fix_counter)
  console.log('Educator Missing MEN: ' + educator_missing_men)

  // Convert the JSON to a string 
  jsonStr = JSON.stringify(jsonData)

  // Convert the JSON back to XML
  const xmlData2 = xmljs.json2xml(jsonStr, {compact: true,spaces: 2})

  // Create the file and save.
  fs.writeFile(fileName, xmlData2, 'utf-8', (err) => {
    if(err){
      console.log('NOT SUCCESSFUL: ERROR - ' + err)
      return
    }
    console.log('Successful! ')
  })
})