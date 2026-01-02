const generateSchedule = (loanData) => {
    const { 
        loanType, 
        financials, 
        startDate = new Date() 
    } = loanData;

    const principal = Number(financials.principalAmount);
    const rate = Number(financials.interestRate); 
    const duration = Number(financials.duration) || 1; // Default 1 or 100 based on type
    const fixedInstallment = Number(financials.fixedInstallmentAmount) || 0;

    const dues = [];
    let currentDate = new Date(startDate);
    
    // Calculate Total Payable Amount
    let totalPayable = principal;
    if (financials.deductionConfig.interest === 'End') {
        // Simple Interest Calculation
        // Note: For Daily/Weekly, usually 'rate' is per month. 
        // We need to standardize how rate applies to these durations.
        // Assuming standard: (Principal * Rate * (Months)) / 100
        // Approx months = duration / 30 for daily, duration / 4 for weekly.
        
        let timeInMonths = 1;
        if(loanType === 'Daily') timeInMonths = duration / 30;
        if(loanType === 'Weekly') timeInMonths = duration / 4; 
        if(loanType === 'Monthly') timeInMonths = duration;

        const totalInterest = (principal * rate * timeInMonths) / 100;
        totalPayable += totalInterest;
    }

    // --- 1. DAILY LOANS (Default 100 Days) ---
    if (loanType === 'Daily') {
        // Logic: Split Total Payable equally over 'duration' (100) days
        const dailyInstallment = Math.ceil(totalPayable / duration);

        for (let i = 1; i <= duration; i++) {
            currentDate.setDate(currentDate.getDate() + 1);
            
            dues.push({
                date: new Date(currentDate),
                type: 'Principal', 
                amount: dailyInstallment,
                status: 'Unpaid',
                installmentNumber: i
            });
        }
    }

    // --- 2. WEEKLY LOANS (Fixed Amount Logic) ---
    else if (loanType === 'Weekly') {
        // Logic: 30000 total, 2000 fixed -> 13 * 2000 + 1 * 4000
        
        let remainingBalance = totalPayable;
        let installmentNum = 1;

        if (fixedInstallment <= 0) {
            // Fallback if admin didn't enter fixed amount: Just divide by duration
            const weeklyAmount = Math.ceil(totalPayable / duration);
             for (let i = 1; i <= duration; i++) {
                currentDate.setDate(currentDate.getDate() + 7);
                dues.push({
                    date: new Date(currentDate),
                    type: 'Principal',
                    amount: weeklyAmount,
                    status: 'Unpaid',
                    installmentNumber: i
                });
            }
        } else {
            // Your Custom Logic
            while (remainingBalance > 0) {
                currentDate.setDate(currentDate.getDate() + 7);
                
                let currentAmount = fixedInstallment;

                // Check if this is the last "remainder" entry
                if (remainingBalance < fixedInstallment) {
                    currentAmount = remainingBalance;
                }

                // If balance is exactly fixedInstallment, this is the last one anyway.
                // If balance is 26000 and fixed is 2000 -> 13 entries exactly.

                dues.push({
                    date: new Date(currentDate),
                    type: 'Principal',
                    amount: currentAmount,
                    status: 'Unpaid',
                    installmentNumber: installmentNum
                });

                remainingBalance -= currentAmount;
                installmentNum++;

                // Safety break to prevent infinite loops in case of bad math
                if(installmentNum > 200) break; 
            }
        }
    }

    // --- 3. MONTHLY LOANS (Single Entry) ---
    else if (loanType === 'Monthly') {
        // Logic: Only 1 due entry at the end of duration (Bullet Repayment)
        
        currentDate.setMonth(currentDate.getMonth() + duration);
        
        dues.push({
            date: new Date(currentDate),
            type: 'Principal', // Contains both Principal + Interest if Interest is 'End'
            amount: totalPayable,
            status: 'Unpaid',
            installmentNumber: 1
        });
    }

    return dues;
};

module.exports = { generateSchedule };