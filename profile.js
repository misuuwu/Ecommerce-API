

        const editBtn = document.getElementById('edit-btn');
        const saveBtn = document.getElementById('save-btn');
        const applyChangesBtn = document.getElementById('apply-changes-btn');
        const readOnlyView = document.getElementById('read-only-view');
        const editableView = document.getElementById('editable-view');
        const applyChangesContainer = document.getElementById('apply-changes-container');
        const imageUploadSection = document.getElementById('image-upload-section');
        const messageBox = document.getElementById('message-box');

        const userNameInput = document.getElementById('fullName');
        const userEmailInput = document.getElementById('email');
        const userPhoneInput = document.getElementById('phone');
        const userAddressInput = document.getElementById('address');
        const genderRadios = document.getElementsByName('gender');
        const dobDateSelect = document.getElementById('dob-date');
        const dobMonthSelect = document.getElementById('dob-month');
        const dobYearSelect = document.getElementById('dob-year');
        const profileImage = document.getElementById('profile-image');
        const uploadImageBtn = document.getElementById('upload-image-btn');
        const imageUploadInput = document.getElementById('image-upload');

        const userProfile = {
            name: "John Doe",
            email: "johndoe@example.com",
            phone: "(123) 456-7890",
            address: "123 Main Street, Anytown, USA 12345",
            gender: "Male",
            dob: { date: "1", month: "January", year: "1990" },
            image: "https://placehold.co/200x200/cccccc/333333?text=Profile"
        };

        // --- Event Listeners ---

        editBtn.addEventListener('click', () => {
            toggleEditMode(true);
        });

        saveBtn.addEventListener('click', saveAndDisplayChanges);
        applyChangesBtn.addEventListener('click', saveAndDisplayChanges);

        uploadImageBtn.addEventListener('click', () => {
            imageUploadInput.click();
        });

        imageUploadInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    profileImage.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        // --- Helper Functions ---

        function saveAndDisplayChanges() {
            // In a real app, this is where you'd send data to a database.
            // For now, we'll just update the display and show a message.
            updateDisplayData();
            toggleEditMode(false);
            showMessage();
        }

        function toggleEditMode(isEditing) {
            if (isEditing) {
                readOnlyView.classList.add('hidden');
                editableView.classList.remove('hidden');
                applyChangesContainer.classList.remove('hidden');
                imageUploadSection.classList.remove('hidden');

                // Populate form fields with current data
                populateFormFields();
            } else {
                readOnlyView.classList.remove('hidden');
                editableView.classList.add('hidden');
                applyChangesContainer.classList.add('hidden');
                imageUploadSection.classList.add('hidden');
            }
        }

        function populateFormFields() {
            userNameInput.value = userProfile.name;
            userEmailInput.value = userProfile.email;
            userPhoneInput.value = userProfile.phone;
            userAddressInput.value = userProfile.address;

            // Set gender
            Array.from(genderRadios).forEach(radio => {
                if (radio.value.toLowerCase() === userProfile.gender.toLowerCase()) {
                    radio.checked = true;
                }
            });

            // Set date of birth
            populateDateOfBirth();
            dobDateSelect.value = userProfile.dob.date;
            const monthIndex = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].indexOf(userProfile.dob.month);
            dobMonthSelect.value = monthIndex + 1;
            dobYearSelect.value = userProfile.dob.year;
        }

        function updateDisplayData() {
            // This is a simplified, non-persistent update.
            // In a real app, you would get this from a database save.
            document.getElementById('user-name-display').textContent = userNameInput.value;
            document.getElementById('user-email-display').textContent = userEmailInput.value;
            document.getElementById('user-phone-display').textContent = userPhoneInput.value;
            document.getElementById('user-address-display').textContent = userAddressInput.value;

            const selectedGender = Array.from(genderRadios).find(radio => radio.checked).value;
            document.getElementById('user-gender-display').textContent = selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1);

            const selectedDate = dobDateSelect.value;
            const selectedMonth = dobMonthSelect.options[dobMonthSelect.selectedIndex].textContent;
            const selectedYear = dobYearSelect.value;
            document.getElementById('user-dob-display').textContent = `${selectedDate}, ${selectedMonth}, ${selectedYear}`;
        }

        function populateDateOfBirth() {
            // Check if already populated to avoid duplicates
            if (dobDateSelect.options.length > 1) return;

            // Populate dates
            for (let i = 1; i <= 31; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i;
                dobDateSelect.appendChild(option);
            }

            // Populate months
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            months.forEach((month, index) => {
                const option = document.createElement('option');
                option.value = index + 1;
                option.textContent = month;
                dobMonthSelect.appendChild(option);
            });

            // Populate years (e.g., last 100 years)
            const currentYear = new Date().getFullYear();
            for (let i = currentYear; i >= currentYear - 100; i--) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i;
                dobYearSelect.appendChild(option);
            }
        }

        function showMessage() {
            messageBox.classList.add('show');
            setTimeout(() => {
                messageBox.classList.remove('show');
            }, 3000); // Hide after 3 seconds
        }

        window.onload = () => {
            populateDateOfBirth();
        };

