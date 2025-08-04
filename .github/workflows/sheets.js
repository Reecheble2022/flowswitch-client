const SHEET_ID = "15b5SOMNDUmR34yrgrtNK4dXgIeteukeWOlOlJjLMMTY";
const FOLDER_ID = '1EJx6eiTeQq5IbOqirPtZUgSsjJu_jtj6';

function doPost(e) {
    try {
        const contentType = e.postData.type;
        if (contentType !== 'application/json') {
            return ContentService.createTextOutput('Invalid content type');
        }

        const data = JSON.parse(e.postData.contents);
        const { name, email, photoBase64, photoName } = data;

        if (!name || !email || !photoBase64 || !photoName) {
            return ContentService.createTextOutput('Missing fields');
        }

        // Decode base64 and create blob
        const blob = Utilities.newBlob(Utilities.base64Decode(photoBase64), MimeType.PNG, photoName);

        // Upload to Drive
        const folder = DriveApp.getFolderById(FOLDER_ID);
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        const fileUrl = `https://drive.google.com/uc?export=view&id=${file.getId()}`;

        // Append to Google Sheet
        const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
        sheet.appendRow([name, email, fileUrl]);

        return ContentService.createTextOutput('Success');
    } catch (err) {
        return ContentService.createTextOutput('Error: ' + err.toString());
    }
}