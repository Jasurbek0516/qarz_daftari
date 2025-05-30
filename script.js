// Login credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';
const AUTH_KEY = 'qarz_daftari_auth';

// Local Storage keys
const DEBTS_KEY = 'qarz_daftari_debts';
const DELETED_DEBTS_KEY = 'qarz_daftari_deleted_debts';

// Update date and time
function updateDateTime() {
  const now = new Date();

  // Format date
  const dateOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  const dateStr = now.toLocaleDateString('uz-UZ', dateOptions);

  // Format time
  const timeOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  const timeStr = now.toLocaleTimeString('uz-UZ', timeOptions);

  // Update display
  document.getElementById('currentDate').textContent = dateStr;
  document.getElementById('currentTime').textContent = timeStr;
}

// Start updating date and time when document loads
document.addEventListener('DOMContentLoaded', function () {
  updateDateTime();
  setInterval(updateDateTime, 1000);

  // Initialize the app
  loadDebts();
  updateStatistics();
  loadDeletedDebts();
  setDefaultDates();
  setupKeyboardShortcuts();
  setupNameValidation();
  setupPhoneValidation();
  setupAmountFormatting();
});

// Add new debt
document.addEventListener('DOMContentLoaded', function () {
  const debtForm = document.getElementById('debtForm');
  if (debtForm) {
    debtForm.addEventListener('submit', function (e) {
      e.preventDefault();
      addDebt();
    });

    // Add event listener for amount input
    const amountInput = document.getElementById('amount');
    if (amountInput) {
      amountInput.addEventListener('input', function () {
        const value = this.value.replace(/[^0-9]/g, '');
        if (value) {
          this.value = formatCurrency(value);
        }
      });
    }

    // Add event listener for edit amount input
    const editAmountInput = document.getElementById('editAmount');
    if (editAmountInput) {
      editAmountInput.addEventListener('input', function () {
        const value = this.value.trim().replace(/[^0-9]/g, '');
        if (!value) {
          showError('editAmount', 'Qarz miqdorini kiriting!');
        } else {
          // Remove error if exists
          const errorDiv = this.parentElement.querySelector('.text-red-500');
          if (errorDiv) {
            errorDiv.remove();
          }
          this.classList.remove('border-red-500');
        }
      });
    }

    // Add event listener for debtDate changes
    document.getElementById('debtDate').addEventListener('change', function () {
      const debtDate = this.value;
      const dueDateInput = document.getElementById('dueDate');
      if (debtDate) {
        dueDateInput.min = debtDate; // Set minimum allowed date for dueDate
      }
    });
  }
});

function addDebt() {
  try {
    // Get form values
    const name = document.getElementById('name').value.trim();
    const surname = document.getElementById('surname').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const amount = document.getElementById('amount').value.replace(/[^0-9]/g, '');
    const debtDate = document.getElementById('debtDate').value;
    const dueDate = document.getElementById('dueDate').value;

    // Validate input
    if (!name || !surname || !phone || !amount || !debtDate || !dueDate) {
      alert('Iltimos, barcha maydonlarni to\'ldiring');
      return;
    }

    if (phone.length !== 9) {
      alert('Telefon raqami 9 ta raqamdan iborat bo\'lishi kerak');
      return;
    }

    if (new Date(dueDate) < new Date(debtDate)) {
      alert('To\'lash sanasi qarz olingan sanadan oldin bo\'lishi mumkin emas');
      return;
    }

    // Get current user and existing debts
    const currentUser = 'admin';
    const debts = JSON.parse(localStorage.getItem(DEBTS_KEY) || '{}');
    if (!debts[currentUser]) {
      debts[currentUser] = [];
    }

    // Create new debt object
    const newDebt = {
      id: Date.now().toString(),
      name,
      surname,
      phone,
      amount: parseInt(amount),
      debtDate,
      dueDate,
      isPaid: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to debts array
    debts[currentUser].unshift(newDebt);
    localStorage.setItem(DEBTS_KEY, JSON.stringify(debts));

    // Reset form
    document.getElementById('debtForm').reset();
    setDefaultDates(); // Set default dates for next entry

    // Reload debts list and update statistics
    loadDebts();
    updateStatistics();

    alert('Yangi qarzdor muvaffaqiyatli qo\'shildi');
  } catch (error) {
    console.error("Add debt error:", error);
    alert('Qarz qo\'shishda xatolik yuz berdi');
  }
}

// Show error message for a field
function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorDiv = document.createElement('div');
  errorDiv.className = 'text-red-500';
  errorDiv.textContent = message;

  field.classList.add('border-red-500');

  // Remove any existing error message
  const existingError = field.parentElement.querySelector('.text-red-500');
  if (existingError) {
    existingError.remove();
  }

  field.parentElement.appendChild(errorDiv);

  // Focus the first field with error
  if (!document.querySelector('.border-red-500')) {
    field.focus();
  }
}

// Reset all error states
function resetErrorStates() {
  // Remove error messages
  document.querySelectorAll('.text-red-500').forEach(el => el.remove());

  // Remove error borders
  document.querySelectorAll('.border-red-500').forEach(el => {
    el.classList.remove('border-red-500');
  });
}

// Add this helper function to calculate days difference
function calculateDaysDifference(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);
  const diffDays = Math.round((secondDate - firstDate) / oneDay);
  return diffDays;
}

// Add this function to format days difference
function formatDaysDifference(dueDate, isPaid) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDateObj = new Date(dueDate);
  dueDateObj.setHours(0, 0, 0, 0);

  const diffDays = calculateDaysDifference(today, dueDateObj);

  if (isPaid) {
    return '';
  }

  if (diffDays > 0) {
    return `<p class="text-sm flex items-center text-blue-600">
              <i class="fas fa-clock mr-2"></i> To'lashga ${diffDays} kun qoldi
            </p>`;
  } else if (diffDays < 0) {
    return `<p class="text-sm flex items-center text-red-600">
              <i class="fas fa-exclamation-circle mr-2"></i> To'lov muddati ${Math.abs(diffDays)} kun o'tib ketdi
            </p>`;
  } else {
    return `<p class="text-sm flex items-center text-yellow-600">
              <i class="fas fa-exclamation-triangle mr-2"></i> Bugun to'lash kerak
            </p>`;
  }
}

// Load debts
function loadDebts(isFiltered = false) {
  try {
    const currentUser = 'admin';
    const debts = JSON.parse(localStorage.getItem(DEBTS_KEY) || '{}');
    const userDebts = debts[currentUser] || [];
    const debtsList = document.getElementById('debtsList');
    const searchQuery = document.getElementById('searchInput')?.value.toLowerCase() || '';

    if (!debtsList) {
      console.error("Debts list container not found!");
      return;
    }

    debtsList.innerHTML = '';

    // Filter debts based on search query
    const filteredDebts = userDebts.filter(debt => {
      const searchString = `${debt.name} ${debt.surname} ${debt.phone}`.toLowerCase();
      return searchString.includes(searchQuery);
    });

    if (isFiltered) {
      // Split into overdue and non-overdue debts
      const overdueDebts = filteredDebts.filter(debt => {
        const dueDate = new Date(debt.dueDate);
        const today = new Date();
        return !debt.isPaid && dueDate < today;
      });

      const nonOverdueDebts = filteredDebts.filter(debt => {
        const dueDate = new Date(debt.dueDate);
        const today = new Date();
        return !debt.isPaid && dueDate >= today;
      });

      const paidDebts = filteredDebts.filter(debt => debt.isPaid);

      // Create container for side-by-side display
      const container = document.createElement('div');
      container.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';

      // Create overdue section
      const overdueSection = document.createElement('div');
      overdueSection.className = 'space-y-4';
      overdueSection.innerHTML = `
        <h3 class="font-bold text-lg text-red-600 flex items-center mb-2">
          <i class="fas fa-exclamation-circle mr-2"></i>
          Muddati o'tgan (${overdueDebts.length})
        </h3>
      `;
      overdueDebts.forEach(debt => {
        overdueSection.appendChild(createDebtCard(debt));
      });

      // Create non-overdue section
      const nonOverdueSection = document.createElement('div');
      nonOverdueSection.className = 'space-y-4';
      nonOverdueSection.innerHTML = `
        <h3 class="font-bold text-lg text-blue-600 flex items-center mb-2">
          <i class="fas fa-clock mr-2"></i>
          Muddati o'tmagan (${nonOverdueDebts.length})
        </h3>
      `;
      nonOverdueDebts.forEach(debt => {
        nonOverdueSection.appendChild(createDebtCard(debt));
      });

      // Add sections to container
      container.appendChild(overdueSection);
      container.appendChild(nonOverdueSection);

      // If there are paid debts, add them at the bottom
      if (paidDebts.length > 0) {
        const paidSection = document.createElement('div');
        paidSection.className = 'col-span-1 md:col-span-2 space-y-4 mt-4';
        paidSection.innerHTML = `
          <h3 class="font-bold text-lg text-green-600 flex items-center mb-2">
            <i class="fas fa-check-circle mr-2"></i>
            To'langan qarzlar (${paidDebts.length})
          </h3>
        `;
        paidDebts.forEach(debt => {
          paidSection.appendChild(createDebtCard(debt));
        });
        container.appendChild(paidSection);
      }

      debtsList.appendChild(container);
    } else {
      // Regular display without filtering
      filteredDebts.forEach(debt => {
        debtsList.appendChild(createDebtCard(debt));
      });
    }

    // Update statistics after loading debts
    updateStatistics();
  } catch (error) {
    console.error("Error loading debts:", error);
  }
}

// Helper function to create debt card
function createDebtCard(debt) {
  const dueDate = new Date(debt.dueDate);
  const today = new Date();
  const isOverdue = !debt.isPaid && dueDate < today;

  const debtElement = document.createElement('div');
  debtElement.className = `debt-card ${isOverdue ? 'bg-red-50' : debt.isPaid ? 'bg-green-50' : 'bg-white'}`;

  debtElement.innerHTML = `
    <div class="p-4">
      <div class="flex justify-between items-start">
        <div class="space-y-2">
          <div class="flex items-center space-x-2">
            <h3 class="font-bold text-lg text-white">${debt.name} ${debt.surname}</h3>
            ${debt.isPaid ?
      `<span class="status-badge paid"><i class="fas fa-check-circle"></i> To'langan</span>` :
      isOverdue ?
        `<span class="status-badge unpaid"><i class="fas fa-exclamation-circle"></i> Muddati o'tgan</span>` :
        ''
    }
          </div>
          <p class="text-sm flex items-center text-gray-300">
            <i class="fas fa-phone mr-2"></i> ${debt.phone}
          </p>
          <p class="text-sm flex items-center text-gray-300">
            <i class="fas fa-money-bill mr-2"></i> ${Number(debt.amount).toLocaleString('uz-UZ')} so'm
          </p>
          <div class="flex items-center space-x-4">
            <p class="text-sm flex items-center text-gray-300">
              <i class="fas fa-calendar mr-2"></i> ${debt.debtDate}
            </p>
            <p class="text-sm flex items-center text-gray-300">
              <i class="fas fa-calendar-alt mr-2"></i> ${debt.dueDate}
            </p>
          </div>
          ${formatDaysDifference(debt.dueDate, debt.isPaid)}
          ${debt.isPaid ?
      `<p class="text-sm flex items-center text-green-400">
                <i class="fas fa-calendar-check mr-2"></i> To'langan sana: ${debt.paidDate}
               </p>` :
      ''
    }
        </div>
        <div class="flex flex-col space-y-2">
          ${debt.isPaid ? `
            <button onclick="unmarkAsPaid('${debt.id}')" 
              class="gradient-bg-danger text-white px-3 py-1 rounded-lg text-sm hover:opacity-90">
              <i class="fas fa-times mr-1"></i> To'lanmadi
            </button>
          ` : `
            <button onclick="markAsPaid('${debt.id}')" 
              class="gradient-bg-success text-white px-3 py-1 rounded-lg text-sm hover:opacity-90">
              <i class="fas fa-check mr-1"></i> To'landi
            </button>
          `}
          <button onclick="editDebt('${debt.id}')" 
            class="gradient-bg text-white px-3 py-1 rounded-lg text-sm hover:opacity-90">
            <i class="fas fa-edit mr-1"></i> Tahrirlash
          </button>
          ${debt.lastEditedValues ? `
            <button onclick="undoLastEdit('${debt.id}')" 
              class="bg-yellow-500 text-white px-3 py-1 rounded-lg text-sm hover:opacity-90">
              <i class="fas fa-undo mr-1"></i> Oldingi holatga qaytarish
            </button>
          ` : ''}
          <button onclick="deleteDebt('${debt.id}')" 
            class="gradient-bg-danger text-white px-3 py-1 rounded-lg text-sm hover:opacity-90">
            <i class="fas fa-trash mr-1"></i> O'chirish
          </button>
        </div>
      </div>
    </div>
  `;

  return debtElement;
}

// Toggle filter function
let isFiltered = false;
function toggleFilter() {
  isFiltered = !isFiltered;
  loadDebts(isFiltered);
}

// Mark debt as paid
function markAsPaid(debtId) {
  try {
    const currentUser = 'admin';
    const debts = JSON.parse(localStorage.getItem(DEBTS_KEY) || '{}');

    const debtIndex = debts[currentUser].findIndex(d => d.id === debtId);
    if (debtIndex !== -1) {
      debts[currentUser][debtIndex].isPaid = true;
      debts[currentUser][debtIndex].paidDate = new Date().toISOString().split('T')[0];
      localStorage.setItem(DEBTS_KEY, JSON.stringify(debts));
      loadDebts();
      updateStatistics();
    }
  } catch (error) {
    console.error("Error marking debt as paid:", error);
    alert("Qarzni to'landi deb belgilashda xatolik yuz berdi");
  }
}

// Show/hide edit modal
function showEditModal() {
  document.getElementById('editModal').classList.remove('hidden');
}

function closeEditModal() {
  document.getElementById('editModal').classList.add('hidden');
  document.getElementById('editForm').reset();
}

// Global variable to store original values
let originalEditValues = null;

function editDebt(debtId) {
  try {
    const currentUser = 'admin';
    const debts = JSON.parse(localStorage.getItem(DEBTS_KEY) || '{}');
    const debt = debts[currentUser].find(d => d.id === debtId);

    if (debt) {
      // Store original values
      originalEditValues = { ...debt };

      // Set form values
      document.getElementById('editName').value = debt.name;
      document.getElementById('editSurname').value = debt.surname || '';
      document.getElementById('editPhone').value = debt.phone;
      document.getElementById('editAmount').value = Number(debt.amount).toLocaleString('uz-UZ');
      document.getElementById('editDebtDate').value = debt.debtDate;
      document.getElementById('editDueDate').value = debt.dueDate;

      // Add event listener for debtDate changes in edit form
      document.getElementById('editDebtDate').addEventListener('change', function () {
        const debtDate = this.value;
        const dueDateInput = document.getElementById('editDueDate');
        if (debtDate) {
          dueDateInput.min = debtDate;
        }
      });

      // Show the edit modal
      showEditModal();

      // Handle form submission
      const editForm = document.getElementById('editForm');
      editForm.onsubmit = function (e) {
        try {
          e.preventDefault();

          // Get form values
          const editedName = document.getElementById('editName').value.trim();
          const editedSurname = document.getElementById('editSurname').value.trim();
          const editedPhone = document.getElementById('editPhone').value.trim();
          const editedAmount = document.getElementById('editAmount').value.trim().replace(/[^0-9]/g, '');
          const editedDebtDate = document.getElementById('editDebtDate').value;
          const editedDueDate = document.getElementById('editDueDate').value;

          // Reset previous error states
          resetErrorStates();

          // Validate required fields
          let hasError = false;
          let emptyFields = [];

          if (!editedName) {
            showError('editName', 'Bo\'sh joylarni to\'ldiring!');
            emptyFields.push('Ism');
            hasError = true;
          }
          if (!editedSurname) {
            showError('editSurname', 'Bo\'sh joylarni to\'ldiring!');
            emptyFields.push('Familiya');
            hasError = true;
          }
          if (!editedPhone) {
            showError('editPhone', 'Bo\'sh joylarni to\'ldiring!');
            emptyFields.push('Telefon');
            hasError = true;
          } else if (editedPhone.length < 9) {
            showError('editPhone', 'Telefon raqami 9 raqamdan iborat bo\'lishi kerak!');
            hasError = true;
          }
          if (!editedAmount) {
            showError('editAmount', 'Bo\'sh joylarni to\'ldiring!');
            emptyFields.push('Qarz miqdori');
            hasError = true;
          }
          if (!editedDebtDate) {
            showError('editDebtDate', 'Bo\'sh joylarni to\'ldiring!');
            emptyFields.push('Qarz olingan sana');
            hasError = true;
          }
          if (!editedDueDate) {
            showError('editDueDate', 'Bo\'sh joylarni to\'ldiring!');
            emptyFields.push('To\'lash sanasi');
            hasError = true;
          }

          if (hasError) {
            if (emptyFields.length > 0) {
              alert('Bo\'sh joylarni to\'ldiring!');
            }
            return;
          }

          const debtIndex = debts[currentUser].findIndex(d => d.id === debtId);
          if (debtIndex !== -1) {
            // Store the current values before updating
            const previousValues = {
              name: debt.name,
              surname: debt.surname,
              phone: debt.phone,
              amount: debt.amount,
              debtDate: debt.debtDate,
              dueDate: debt.dueDate
            };

            const updatedDebt = {
              id: debtId,
              name: editedName,
              surname: editedSurname,
              phone: editedPhone,
              amount: editedAmount,
              debtDate: editedDebtDate,
              dueDate: editedDueDate,
              isPaid: debt.isPaid,
              paidDate: debt.paidDate,
              lastEditedValues: previousValues
            };

            debts[currentUser][debtIndex] = updatedDebt;
            localStorage.setItem(DEBTS_KEY, JSON.stringify(debts));

            closeEditModal();
            loadDebts();
            updateStatistics();
          }
        } catch (error) {
          console.error("Error updating debt:", error);
          alert("Qarzni yangilashda xatolik yuz berdi");
        }
      };
    }
  } catch (error) {
    console.error("Error in editDebt:", error);
    alert("Qarzni tahrirlashda xatolik yuz berdi");
  }
}

function resetEditForm() {
  try {
    if (originalEditValues) {
      // Restore original values
      document.getElementById('editName').value = originalEditValues.name;
      document.getElementById('editSurname').value = originalEditValues.surname || '';
      document.getElementById('editPhone').value = originalEditValues.phone;
      document.getElementById('editAmount').value = Number(originalEditValues.amount).toLocaleString('uz-UZ');
      document.getElementById('editDebtDate').value = originalEditValues.debtDate;
      document.getElementById('editDueDate').value = originalEditValues.dueDate;

      // Reset any error states
      resetErrorStates();
    }
  } catch (error) {
    console.error("Error in resetEditForm:", error);
  }
}

// Search functionality
document.addEventListener('DOMContentLoaded', function () {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', loadDebts);
  }
});

// Delete debt
function deleteDebt(debtId) {
  try {
    if (confirm("Rostdan ham bu qarzni o'chirmoqchimisiz?")) {
      const currentUser = 'admin';
      const debts = JSON.parse(localStorage.getItem(DEBTS_KEY) || '{}');
      const deletedDebts = JSON.parse(localStorage.getItem(DELETED_DEBTS_KEY) || '{}');

      if (!deletedDebts[currentUser]) {
        deletedDebts[currentUser] = [];
      }

      const debtIndex = debts[currentUser].findIndex(d => d.id === debtId);
      if (debtIndex !== -1) {
        // Move to deleted debts with deletion timestamp
        const deletedDebt = {
          ...debts[currentUser][debtIndex],
          deletedAt: new Date().toISOString()
        };
        deletedDebts[currentUser].unshift(deletedDebt);
        localStorage.setItem(DELETED_DEBTS_KEY, JSON.stringify(deletedDebts));

        // Remove from active debts
        debts[currentUser].splice(debtIndex, 1);
        localStorage.setItem(DEBTS_KEY, JSON.stringify(debts));

        loadDebts();
        updateStatistics();
        loadDeletedDebts();
      }
    }
  } catch (error) {
    console.error("Error deleting debt:", error);
    alert("Qarzni o'chirishda xatolik yuz berdi");
  }
}

// Load deleted debts
function loadDeletedDebts() {
  try {
    const currentUser = 'admin';
    const deletedDebts = JSON.parse(localStorage.getItem(DELETED_DEBTS_KEY) || '{}');
    const userDeletedDebts = deletedDebts[currentUser] || [];
    const deletedDebtsList = document.getElementById('deletedDebtsList');

    if (!deletedDebtsList) return;

    deletedDebtsList.innerHTML = '';

    if (userDeletedDebts.length === 0) {
      deletedDebtsList.innerHTML = `
        <div class="text-center text-gray-400 py-4">
          <i class="fas fa-trash text-2xl mb-2"></i>
          <p>O'chirilgan qarzdorlar yo'q</p>
        </div>
      `;
      return;
    }

    userDeletedDebts.forEach(debt => {
      const deletedDate = new Date(debt.deletedAt).toLocaleDateString('uz-UZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const debtElement = document.createElement('div');
      debtElement.className = 'debt-card bg-red-900/20';
      debtElement.innerHTML = `
        <div class="p-4">
          <div class="flex justify-between items-start">
            <div class="space-y-2">
              <div class="flex items-center space-x-2">
                <h3 class="font-bold text-lg text-white">${debt.name} ${debt.surname}</h3>
                <span class="status-badge deleted">
                  <i class="fas fa-trash"></i> O'chirilgan
                </span>
              </div>
              <p class="text-sm flex items-center text-gray-300">
                <i class="fas fa-phone mr-2"></i> ${debt.phone}
              </p>
              <p class="text-sm flex items-center text-gray-300">
                <i class="fas fa-money-bill mr-2"></i> ${Number(debt.amount).toLocaleString('uz-UZ')} so'm
              </p>
              <div class="flex items-center space-x-4">
                <p class="text-sm flex items-center text-gray-300">
                  <i class="fas fa-calendar mr-2"></i> ${debt.debtDate}
                </p>
                <p class="text-sm flex items-center text-gray-300">
                  <i class="fas fa-calendar-alt mr-2"></i> ${debt.dueDate}
                </p>
              </div>
              <p class="text-sm flex items-center text-red-400">
                <i class="fas fa-clock mr-2"></i> O'chirilgan sana: ${deletedDate}
              </p>
            </div>
            <div class="flex flex-col space-y-2">
              <button onclick="restoreDebt('${debt.id}')" 
                class="gradient-bg text-white px-3 py-1 rounded-lg text-sm hover:opacity-90">
                <i class="fas fa-undo mr-1"></i> Qaytarish
              </button>
              <button onclick="permanentlyDeleteDebt('${debt.id}')" 
                class="gradient-bg-danger text-white px-3 py-1 rounded-lg text-sm hover:opacity-90">
                <i class="fas fa-trash mr-1"></i> Butunlay o'chirish
              </button>
            </div>
          </div>
        </div>
      `;
      deletedDebtsList.appendChild(debtElement);
    });
  } catch (error) {
    console.error("Error loading deleted debts:", error);
  }
}

// Restore deleted debt
function restoreDebt(debtId) {
  try {
    if (confirm("Rostdan ham bu qarzni qaytarmoqchimisiz?")) {
      const currentUser = 'admin';
      const debts = JSON.parse(localStorage.getItem(DEBTS_KEY) || '{}');
      const deletedDebts = JSON.parse(localStorage.getItem(DELETED_DEBTS_KEY) || '{}');

      if (!debts[currentUser]) {
        debts[currentUser] = [];
      }

      const deletedDebtIndex = deletedDebts[currentUser].findIndex(d => d.id === debtId);
      if (deletedDebtIndex !== -1) {
        // Remove deletion timestamp and move back to active debts
        const restoredDebt = { ...deletedDebts[currentUser][deletedDebtIndex] };
        delete restoredDebt.deletedAt;
        debts[currentUser].unshift(restoredDebt);
        localStorage.setItem(DEBTS_KEY, JSON.stringify(debts));

        // Remove from deleted debts
        deletedDebts[currentUser].splice(deletedDebtIndex, 1);
        localStorage.setItem(DELETED_DEBTS_KEY, JSON.stringify(deletedDebts));

        loadDebts();
        updateStatistics();
        loadDeletedDebts();
      }
    }
  } catch (error) {
    console.error("Error restoring debt:", error);
    alert("Qarzni qaytarishda xatolik yuz berdi");
  }
}

// Permanently delete debt
function permanentlyDeleteDebt(debtId) {
  try {
    if (confirm("Rostdan ham bu qarzni butunlay o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi!")) {
      const currentUser = 'admin';
      const deletedDebts = JSON.parse(localStorage.getItem(DELETED_DEBTS_KEY) || '{}');

      const deletedDebtIndex = deletedDebts[currentUser].findIndex(d => d.id === debtId);
      if (deletedDebtIndex !== -1) {
        deletedDebts[currentUser].splice(deletedDebtIndex, 1);
        localStorage.setItem(DELETED_DEBTS_KEY, JSON.stringify(deletedDebts));
        loadDeletedDebts();
      }
    }
  } catch (error) {
    console.error("Error permanently deleting debt:", error);
    alert("Qarzni butunlay o'chirishda xatolik yuz berdi");
  }
}

// Format currency helper function
function formatCurrency(amount) {
  try {
    const num = Number(amount);
    if (isNaN(num)) return "0 so'm";
    return num.toLocaleString('uz-UZ') + " so'm";
  } catch (error) {
    console.error("Error formatting currency:", error);
    return "0 so'm";
  }
}

// Update statistics
function updateStatistics() {
  try {
    const currentUser = 'admin';
    const debts = JSON.parse(localStorage.getItem(DEBTS_KEY) || '{}');
    const userDebts = debts[currentUser] || [];

    // Calculate total debtors (excluding paid debts)
    const totalDebtors = userDebts.filter(debt => !debt.isPaid).length;

    // Calculate total debt (all debts, including paid ones)
    const totalDebt = userDebts.reduce((sum, debt) => {
      // Handle both string and number amount formats
      const amount = typeof debt.amount === 'number' ?
        debt.amount :
        Number(debt.amount.toString().replace(/[^0-9.-]+/g, ''));
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    // Calculate unpaid debt
    const unpaidDebt = userDebts
      .filter(debt => !debt.isPaid)
      .reduce((sum, debt) => {
        const amount = typeof debt.amount === 'number' ?
          debt.amount :
          Number(debt.amount.toString().replace(/[^0-9.-]+/g, ''));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

    // Calculate overdue count
    const overdueCount = userDebts.filter(debt => {
      return !debt.isPaid && new Date(debt.dueDate) < new Date();
    }).length;

    // Update the display with proper formatting
    document.getElementById('totalDebtors').textContent = totalDebtors + " ta";
    document.getElementById('totalDebt').textContent = formatCurrency(totalDebt);
    document.getElementById('unpaidDebt').textContent = formatCurrency(unpaidDebt);
    document.getElementById('overdueCount').textContent = overdueCount + " ta";
  } catch (error) {
    console.error("Error updating statistics:", error);
  }
}

// Mark debt as unpaid
function unmarkAsPaid(debtId) {
  try {
    if (confirm("Rostdan ham bu qarzni to'lanmagan holatga qaytarmoqchimisiz?")) {
      const currentUser = 'admin';
      const debts = JSON.parse(localStorage.getItem(DEBTS_KEY) || '{}');

      const debtIndex = debts[currentUser].findIndex(d => d.id === debtId);
      if (debtIndex !== -1) {
        debts[currentUser][debtIndex].isPaid = false;
        debts[currentUser][debtIndex].paidDate = null;
        localStorage.setItem(DEBTS_KEY, JSON.stringify(debts));
        loadDebts();
        updateStatistics();
      }
    }
  } catch (error) {
    console.error("Error unmarking debt as paid:", error);
    alert("Qarzni to'lanmagan holatga qaytarishda xatolik yuz berdi");
  }
}

// Set default dates when the form loads
function setDefaultDates() {
  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  document.getElementById('debtDate').value = today;
  document.getElementById('dueDate').value = nextMonth.toISOString().split('T')[0];
}

// Add keyboard shortcuts
function setupKeyboardShortcuts() {
  // Focus search with Ctrl + F
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      document.getElementById('searchInput')?.focus();
    }
  });

  // Submit form with Ctrl + Enter
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('debtForm')?.requestSubmit();
    }
  });

  // Quick navigation between form fields with Enter
  const formFields = ['name', 'surname', 'phone', 'amount', 'debtDate', 'dueDate'];
  formFields.forEach((fieldId, index) => {
    document.getElementById(fieldId)?.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.ctrlKey) {
        e.preventDefault();
        const nextField = document.getElementById(formFields[index + 1]);
        if (nextField) {
          nextField.focus();
        } else {
          document.getElementById('debtForm')?.requestSubmit();
        }
      }
    });
  });
}

// Add name validation setup
function setupNameValidation() {
  const nameInputs = ['name', 'editName'];
  nameInputs.forEach(inputId => {
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener('input', function () {
        const value = this.value.trim();
        // Remove error if exists
        const errorDiv = this.parentElement.querySelector('.text-red-500');
        if (errorDiv) {
          errorDiv.remove();
        }
        this.classList.remove('border-red-500');
      });
    }
  });
}

// Setup phone number validation
function setupPhoneValidation() {
  const phoneInput = document.getElementById('phone');
  const editPhoneInput = document.getElementById('editPhone');

  // Function to validate phone input
  function validatePhoneInput(e) {
    // Allow: backspace, delete, tab, escape, enter
    if ([46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
      // Allow: Ctrl+A, Command+A
      (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
      // Allow: Ctrl+C, Command+C
      (e.keyCode === 67 && (e.ctrlKey === true || e.metaKey === true)) ||
      // Allow: Ctrl+V, Command+V
      (e.keyCode === 86 && (e.ctrlKey === true || e.metaKey === true)) ||
      // Allow: Ctrl+X, Command+X
      (e.keyCode === 88 && (e.ctrlKey === true || e.metaKey === true)) ||
      // Allow: home, end, left, right, down, up
      (e.keyCode >= 35 && e.keyCode <= 40)) {
      return;
    }
    // Ensure that it is a number and stop the keypress if not
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  }

  // Function to clean input value and validate
  function cleanPhoneInput(e) {
    const input = e.target;
    input.value = input.value.replace(/\D/g, '').substring(0, 9);

    // Remove error if exists
    const errorDiv = input.parentElement.querySelector('.text-red-500');
    if (errorDiv) {
      errorDiv.remove();
    }
    input.classList.remove('border-red-500');
  }

  // Add validation to main form phone input
  if (phoneInput) {
    phoneInput.addEventListener('keydown', validatePhoneInput);
    phoneInput.addEventListener('input', cleanPhoneInput);
  }

  // Add validation to edit form phone input
  if (editPhoneInput) {
    editPhoneInput.addEventListener('keydown', validatePhoneInput);
    editPhoneInput.addEventListener('input', cleanPhoneInput);
  }
}

// Format amount input
function setupAmountFormatting() {
  const amountInputs = ['amount', 'editAmount'];
  amountInputs.forEach(inputId => {
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener('input', function (e) {
        // Remove any non-digit characters
        let value = this.value.replace(/[^\d.]/g, '');

        // Remove all dots except the last one
        let parts = value.split('.');
        if (parts.length > 2) {
          value = parts[0] + '.' + parts.slice(1).join('');
        }

        // Format the number with thousand separators
        if (value) {
          const num = parseFloat(value.replace(/,/g, ''));
          if (!isNaN(num)) {
            // Format with thousand separators
            this.value = num.toLocaleString('uz-UZ');
          }
        }
      });

      // Handle paste events
      input.addEventListener('paste', function (e) {
        e.preventDefault();
        let pastedText = (e.clipboardData || window.clipboardData).getData('text');

        // Remove any non-digit characters except dot
        pastedText = pastedText.replace(/[^\d.]/g, '');

        // Remove all dots except the last one
        let parts = pastedText.split('.');
        if (parts.length > 2) {
          pastedText = parts[0] + '.' + parts.slice(1).join('');
        }

        if (pastedText) {
          const num = parseFloat(pastedText);
          if (!isNaN(num)) {
            this.value = num.toLocaleString('uz-UZ');
          }
        }
      });

      // Allow only numbers, dot, and navigation keys
      input.addEventListener('keydown', function (e) {
        // Allow: backspace, delete, tab, escape, enter, dots, commas
        if ([46, 8, 9, 27, 13, 110, 190, 188].indexOf(e.keyCode) !== -1 ||
          // Allow: Ctrl+A, Command+A
          (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
          // Allow: Ctrl+C, Command+C
          (e.keyCode === 67 && (e.ctrlKey === true || e.metaKey === true)) ||
          // Allow: Ctrl+V, Command+V
          (e.keyCode === 86 && (e.ctrlKey === true || e.metaKey === true)) ||
          // Allow: Ctrl+X, Command+X
          (e.keyCode === 88 && (e.ctrlKey === true || e.metaKey === true)) ||
          // Allow: home, end, left, right, down, up
          (e.keyCode >= 35 && e.keyCode <= 40)) {
          return;
        }
        // Ensure that it is a number and stop the keypress if not
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
          e.preventDefault();
        }
      });
    }
  });
}

// Add undoLastEdit function
function undoLastEdit(debtId) {
  try {
    if (confirm("Rostdan ham oxirgi tahrirlashdan oldingi holatga qaytarmoqchimisiz?")) {
      const currentUser = 'admin';
      const debts = JSON.parse(localStorage.getItem(DEBTS_KEY) || '{}');

      const debtIndex = debts[currentUser].findIndex(d => d.id === debtId);
      if (debtIndex !== -1 && debts[currentUser][debtIndex].lastEditedValues) {
        // Restore the previous values
        const debt = debts[currentUser][debtIndex];
        const restoredDebt = {
          ...debt.lastEditedValues,
          id: debt.id,
          isPaid: debt.isPaid,
          paidDate: debt.paidDate
        };
        // Remove the lastEditedValues property
        delete restoredDebt.lastEditedValues;

        debts[currentUser][debtIndex] = restoredDebt;
        localStorage.setItem(DEBTS_KEY, JSON.stringify(debts));
        loadDebts();
        updateStatistics();
      }
    }
  } catch (error) {
    console.error("Error undoing last edit:", error);
    alert("Oldingi holatga qaytarishda xatolik yuz berdi");
  }
}

// Check authentication status
function checkAuth() {
  const isAuthenticated = localStorage.getItem(AUTH_KEY) === 'true';
  document.getElementById('loginPage').classList.toggle('hidden', isAuthenticated);
  document.getElementById('mainPage').classList.toggle('hidden', !isAuthenticated);
  if (isAuthenticated) {
    initializeApp();
  }
}

// Initialize app after successful login
function initializeApp() {
  updateDateTime();
  setInterval(updateDateTime, 1000);
  loadDebts();
  updateStatistics();
  loadDeletedDebts();
  setDefaultDates();
  setupKeyboardShortcuts();
  setupNameValidation();
  setupPhoneValidation();
  setupAmountFormatting();
}

// Handle login
document.addEventListener('DOMContentLoaded', function () {
  checkAuth();

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        localStorage.setItem(AUTH_KEY, 'true');
        checkAuth();
      } else {
        alert('Login yoki parol noto\'g\'ri!');
      }

      loginForm.reset();
    });
  }
});

// Handle logout
function logout() {
  if (confirm('Rostdan ham chiqmoqchimisiz?')) {
    localStorage.removeItem(AUTH_KEY);
    checkAuth();
  }
} 