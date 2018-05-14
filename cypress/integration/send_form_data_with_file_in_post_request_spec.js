// Build and send a form containing an excel file and other plain inputs directly to the backend

describe('Testing the API', function () {
     
  it('Receives valid FormData and proccesses the information correctly', function () {

      /*
      The reason why this test may look a bit tricky is because the backend endpoint is expecting the 
      submission of a web Form (multipart/form-data), not just data within a POST. The "cy.request()" 
      command doesn't support sending a web Form as a body in a POST request, so the test uses a support 
      command that has been created to perform a genuine XMLHttpRequest where a web Form can be placed.
      */

      //Declarations
      const fileName = 'your_excel_file.xlsx';
      const method = 'POST';
      const url = 'http://localhost:3000/api/excel_form';
      const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const inputContent2 = 'input_content2';
      const expectedAnswer = '{"msg":"X elements from the excel where successfully imported"}';

      // Get file from fixtures as binary
      cy.fixture(fileName, 'binary').then( (excelBin) => {

          // File in binary format gets converted to blob so it can be sent as Form data
          Cypress.Blob.binaryStringToBlob(excelBin, fileType).then((blob) => {

              // Build up the form
              const formData = new FormData();
              formData.set('file', blob, fileName); //adding a file to the form
              formData.set('input2', inputContent2); //adding a plain input to the form
              
              // Perform the request
              cy.form_request(method, url, formData, function (response) {
                  expect(response.status).to.eq(200);
                  expect(expectedAnswer).to.eq(response.response);
              });
              
          })
          
      })
      
  })

})