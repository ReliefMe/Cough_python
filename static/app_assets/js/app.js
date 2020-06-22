let currentStep = 0;

// onload show first step
showStep(currentStep);

// on next button click
document.getElementById('next').addEventListener('click', function () {
    // Validating the form
    if (validateForm(currentStep)) {

        // incrementing the step
        currentStep += 1;

        // showing the incremented step;
        showStep(currentStep);
    }

});

// on prev button click
document.getElementById('previous').addEventListener('click', function () {

    // decrementing the step
    currentStep -= 1;

    // showing decremented step
    showStep(currentStep);
});

function showStep(step) {
    // display button
    // checking whether the current step is valid or not
    if (step === 0 || step === 1) {
        document.getElementById('previous').style.display = 'none'
        document.getElementById('next').style.display = 'inline';
        document.getElementById('submit').style.display = 'none';
    } else if (step === document.getElementsByClassName('step').length - 1) {
        document.getElementById('previous').style.display = 'inline'
        document.getElementById('next').style.display = 'none';
        document.getElementById('submit').style.display = 'inline';
    } else {
        document.getElementById('previous').style.display = 'inline'
        document.getElementById('next').style.display = 'inline';
        document.getElementById('submit').style.display = 'none';
    }

    // displaying question counter
    document.querySelector('#step-counter h1').textContent = step + 1;

    currentStep = step;

    document.querySelectorAll('.step').forEach((item, index) => {
        // display step
        if (index !== step) {
            item.style.display = 'none';
        } else {
            item.style.display = 'block';
        }
    });

}

// for form validation 
function validateForm(step) {
    let subForm = document.querySelectorAll('.step')[step];
    let flag = true;

    // for radio button input (consent form) validation
    if (subForm.querySelector('input[type=radio]') != null) {
        if (subForm.querySelector("input[type=radio]").checked !== true) {
            alert("Please, agree with the terms.");
            flag = false;
        }
    }

    // for all input['number'] and select tags
    subForm.querySelectorAll("input[type=number], select").forEach((item) => {
        // console.log(item);
        if (item.value === '' || item.value <= 0) {
            item.classList.add('is-invalid');
            flag = false;
        } else {
            item.classList.remove('is-invalid');
            item.classList.add('is-valid');
        }
    });

    // for all input['checkbox']
    if (subForm.querySelector('input[type=checkbox]') != null) {
        let check = false;
        subForm.querySelectorAll('input[type=checkbox]').forEach((item, index) => {
            // Can't skip the process -- show alert if user tries to do so
            if (item.checked === true)
                check = true;
        });

        if (!check) {
            alert("Please check atleast one value.");
            flag = false;
        }
    }

    return flag;
}

// Adding event listener for fetching result
document.querySelector('#submit').addEventListener('click', fetchResult);


async function fetchResult(e) {
    e.preventDefault();

    if (currentStep === document.getElementsByClassName('step').length - 1 && validateForm(currentStep)) {

        /////// loader added
        $('#loader_1').show();
        $('#loader_1').html('Wait.. <img src="static/app_assets/images/loader.gif" />')
        ///////

        var messgae_print = $('#message_print').val();

        var rizwan = document.getElementById('mydatas');
        let fd = new FormData(rizwan);

        let cough_audio, breath_audio;

        if (document.querySelector('#cough-audio') != null) {
            cough_audio = await fetch(document.querySelector('#cough-audio').src).then(
                r => r.blob()
            );
        } else {
            alert("Please record cough, its mandatory!");
            $('#loader_1').hide();  //loader added here
            return;
        }

        if (document.querySelector('#breath-audio') != null) {
            breath_audio = await fetch(document.querySelector('#breath-audio').src).then(
                r => r.blob()
            );
        } else {
            alert("Please record breath, its mandatory!");
            $('#loader_1').hide();  //loader added here
            return;
        }

        fd.append("cough_data", cough_audio, "coughFile.wav");
        fd.append("breath_data", breath_audio, "breathFile.wav");

        $.ajax({
            type: "POST",
            url: 'https://predict.reliefme.org/data',
            // url: 'http://127.0.0.1:5000/data',
            data: fd, // Data sent to server, a set of key/value pairs (i.e. form fields and values)
            contentType: false, // The content type used when sending data to the server.
            cache: false, // To unable request pages to be cached
            processData: false,
            success: function (result) {
                Swal.fire({
                    html: "<div style='margin-bottom: 10px;'> <img src='static/app_assets/images/logo-black.png' width='300'> </div>" +
                            "<h4>Your Statistical symptoms show probability of Corona :  </h4>" +
                            "<h4>Your cough patterns show probability of Corona : </h4>" +
                            "<h4>Your breath patterns show probability of Corona : </h4>" +
                            "<h3 class='font-weight-bold text-success' align = 'center'><u>Final Result</u></h3>" +
                            "<h4 class='font-weight-bold'> </h4>",

                    onBeforeOpen: () => {
                        const content = Swal.getContent()
                        if (content) {
                          const b = content.querySelectorAll('h4')
                          if (b) {
                            let {prediction, cough_result, breath_result, msg} = result;
                            b[0].textContent += prediction + " %";
                            b[1].textContent += cough_result+ " %";           
                            b[2].textContent += breath_result+ " %";
                            b[3].textContent = msg;
                          }
                        }
                    }
                //     showCancelButton: true,
                //     confirmButtonColor: '#3085d6',
                //     cancelButtonColor: '#d33',
                //     confirmButtonText: 'Download!',
                //     className: 'window'
                //     // text: result
                // }).then((result) => {
                //     if (result.value) {
                //         // window.scrollTo(0, 0);
                //         var image;
                        
                //         html2canvas(document.querySelector(".window"), {width: 2000, height: 2000}).then(function (canvas) {
                            
                //             image = canvas.toDataURL("", "image/png", 0.9);
                //             // console.log(image);

                //             let link = document.createElement('a');

                //             link.href = image
                //             link.download = "ReliefMe-report.png"

                //             link.click();

                //             URL.revokeObjectURL(link.href);
                //         }).catch(err => console.log(err));
                        
                //     }
                });
                

                ////////// loader added
                $('#loader_1').hide();
                /////////////
            }
        });
    }
}