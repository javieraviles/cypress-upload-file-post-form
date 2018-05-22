# cypress-upload-file-post-form

Solution for two Cypress testing use-cases I came across with: perform a direct http FORM request to the server containing a file and other parameters and upload a file into a form before submission. It works for excel files.

For both cases, the file to be uploaded / sent in the form will be placed in [fixtures](https://docs.cypress.io/api/commands/fixture.html#Syntax) folder so it can be loaded by cypress.

To build these workarounds, I found useful these two links:

[Cypress Issue #170](https://github.com/cypress-io/cypress/issues/170)
[StackOverflow](https://stackoverflow.com/questions/47533989/upload-file-with-cypress-io-via-request)


## First scenario (upload_file_to_form_spec.js):

I want to test a UI where a file has to be selected/uploaded before submitting the form.

Include the following code in your "commands.js" file within the cypress support folder, so the command cy.upload_file() can be used from any test:

```
Cypress.Commands.add('upload_file', (fileName, fileType = ' ', selector) => {
    cy.get(selector).then(subject => {
      cy.fixture(fileName, 'base64')
        .then(Cypress.Blob.base64StringToBlob)
        .then(blob => {
          const el = subject[0]
          const testFile = new File([blob], fileName, { type: fileType })
          const dataTransfer = new DataTransfer()
          dataTransfer.items.add(testFile)
          el.files = dataTransfer.files
        })
    })
  })
```

Then, in case you want to upload an excel file, fill in other inputs and submit the form, the test would be something like this:

```
describe('Testing the excel form', function () {
    it ('Uploading the right file imports data from the excel successfully', function() {

        const testUrl = 'http://localhost:3000/excel_form';
        const fileName = 'your_file_name.xlsx';
        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        const fileInput = 'input[type=file]';

        cy.visit(testUrl);
        cy.upload_file(fileName, fileType, fileInput);
        cy.get('#other_form_input2').type('input_content2');
        .
        .
        .
        cy.get('button').contains('Submit').click();

        cy.get('.result-dialog').should('contain', 'X elements from the excel where successfully imported');
    })
})
```


## Second scenario (send_form_data_with_file_in_post_request_spec.js):

I want to build up the FormData myself( new FormData(), formData.append/formData.set ) and send it directly with a POST request to the backend or submit the form with the FormData I have created.

For this case, the transmitted data must be in the same format as the form's submit(), which type is set to "multipart/form-data".
Having a look at the MDN web docs to see how you can build a FormData: [Using FormData Objects](https://developer.mozilla.org/en-US/docs/Web/API/FormData/Using_FormData_Objects), and knowing that at this very moment (Cypress 2.1.0) cy.request doesn't support FormData (multipart/form-data) so we will need a [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest), the test can be performed as follows.


Include the following code in your "commands.js" file within the cypress support folder, so the command cy.form_request() can be used from any test:

```
// Performs an XMLHttpRequest instead of a cy.request (able to send data as FormData - multipart/form-data)
Cypress.Commands.add('form_request', (method, url, formData, done) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.onload = function () {
        done(xhr);
    };
    xhr.onerror = function () {
        done(xhr);
    };
    xhr.send(formData);
})
```

Then, in case you want to send the same form as before (form containing an excel file and other plain inputs) but build it by yourself and send it directly to the server, the test would be something like this:

```
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
                .
                .
                .
                // Perform the request
                cy.form_request(method, url, formData, function (response) {
                    expect(response.status).to.eq(200);
                    expect(expectedAnswer).to.eq(response.response);
                });
                
            })
            
        })
        
    })
      
})
```