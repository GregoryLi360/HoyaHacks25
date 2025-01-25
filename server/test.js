fetch("https://hoyahacks25.onrender.com/api/1234567890", {
    method: "GET",
    headers: {
        // 'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + '05d49692b755f99c4504b510418efeeeebfd466892540f27acf9a31a326d6504',
    },
    // body: JSON.stringify({
    //     'MRN': '1234567890',
    //     'firstName': 'John',
    //     'lastName': 'Doe',
    //     'diagnosis': 'Example Diagnosis',
    //     'notes': '',
    //     'medications': 'Medication 1, Medication 2'
    // })
})
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));