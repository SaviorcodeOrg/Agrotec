import web from "./webconnections.js";

const key = process.env.NESSIE_KEY;
const BASE_URL = "https://api.nessieisreal.com";

class Nessie {
    // --- Customers ---------------------------------------------------

    get_customers() {
        return web.get(
            `${BASE_URL}/customers?key=${key}`
        );
    }

    create_customer(customer = {
        first_name: "Emilio",
        last_name: "Benitez",
        address: {
            street_number: "123",
            street_name: "Durango",
            city: "Durango",
            state: "Mexico",
            zip: "34176"
        }
    }) {
        return web.post(
            `${BASE_URL}/customers?key=${key}`,
            customer
        );
    }

    get_customer_by_id(id) {
        return web.get(
            `${BASE_URL}/customers/${id}?key=${key}`
        );
    }

    update_customer(id, customer) {
        return web.put(
            `${BASE_URL}/customers/${id}?key=${key}`,
            customer
        );
    }

    get_customer_for_account(accountId) {
        return web.get(
            `${BASE_URL}/accounts/${accountId}/customer?key=${key}`
        );
    }

    // --- Accounts ------------------------------------------------------

    get_accounts_for_customer(customerId) {
        return web.get(
            `${BASE_URL}/customers/${customerId}/accounts?key=${key}`
        );
    }

    create_account_for_customer(customerId, account) {
        return web.post(
            `${BASE_URL}/customers/${customerId}/accounts?key=${key}`,
            account
        );
    }

    get_accounts() {
        return web.get(
            `${BASE_URL}/accounts?key=${key}`
        );
    }

    get_account_by_id(id) {
        return web.get(
            `${BASE_URL}/accounts/${id}?key=${key}`
        );
    }

    update_account(id, account) {
        return web.put(
            `${BASE_URL}/accounts/${id}?key=${key}`,
            account
        );
    }

    delete_account(id) {
        return web.delete(
            `${BASE_URL}/accounts/${id}?key=${key}`
        );
    }

    // --- Deposits --------------------------------------------------------

    get_deposits_for_account(accountId) {
        return web.get(
            `${BASE_URL}/accounts/${accountId}/deposits?key=${key}`
        );
    }

    create_deposit_for_account(accountId, deposit) {
        return web.post(
            `${BASE_URL}/accounts/${accountId}/deposits?key=${key}`,
            deposit
        );
    }

    get_deposits() {
        return web.get(
            `${BASE_URL}/deposits?key=${key}`
        );
    }

    get_deposit_by_id(id) {
        return web.get(
            `${BASE_URL}/deposits/${id}?key=${key}`
        );
    }

    update_deposit(id, deposit) {
        return web.put(
            `${BASE_URL}/deposits/${id}?key=${key}`,
            deposit
        );
    }

    delete_deposit(id) {
        return web.delete(
            `${BASE_URL}/deposits/${id}?key=${key}`
        );
    }

    // --- Withdrawals -------------------------------------------------

    get_withdrawal_by_id(withdrawalId) {
        return web.get(
            `${BASE_URL}/withdrawal/${withdrawalId}?key=${key}`
        );
    }

    update_withdrawal(withdrawalId, withdrawal) {
        return web.put(
            `${BASE_URL}/withdrawal/${withdrawalId}?key=${key}`,
            withdrawal
        );
    }

    delete_withdrawal(withdrawalId) {
        return web.delete(
            `${BASE_URL}/withdrawal/${withdrawalId}?key=${key}`
        );
    }

    get_withdrawals_for_account(accountId) {
        return web.get(
            `${BASE_URL}/accounts/${accountId}/withdrawals?key=${key}`
        );
    }

    create_withdrawal_for_account(accountId, withdrawal) {
        return web.post(
            `${BASE_URL}/accounts/${accountId}/withdrawals?key=${key}`,
            withdrawal
        );
    }

    // --- Transfers -----------------------------------------------------

    get_transfer_by_id(transferId) {
        return web.get(
            `${BASE_URL}/transfers/${transferId}?key=${key}`
        );
    }

    update_transfer(transferId, transfer) {
        return web.put(
            `${BASE_URL}/transfers/${transferId}?key=${key}`,
            transfer
        );
    }

    delete_transfer(transferId) {
        return web.delete(
            `${BASE_URL}/transfers/${transferId}?key=${key}`
        );
    }

    // --- Purchases -------------------------------------------------------

    get_purchase_by_id(purchaseId) {
        return web.get(
            `${BASE_URL}/purchase/${purchaseId}?key=${key}`
        );
    }

    update_purchase(purchaseId, purchase) {
        return web.put(
            `${BASE_URL}/purchase/${purchaseId}?key=${key}`,
            purchase
        );
    }

    delete_purchase(purchaseId) {
        return web.delete(
            `${BASE_URL}/purchase/${purchaseId}?key=${key}`
        );
    }

    // --- Loans -------------------------------------------------------------

    get_loans_for_account(accountId) {
        return web.get(
            `${BASE_URL}/accounts/${accountId}/loans?key=${key}`
        );
    }

    create_loan_for_account(accountId, loan) {
        return web.post(
            `${BASE_URL}/accounts/${accountId}/loans?key=${key}`,
            loan
        );
    }

    get_loan_by_id(id) {
        return web.get(
            `${BASE_URL}/loans/${id}?key=${key}`
        );
    }

    update_loan(id, loan) {
        return web.put(
            `${BASE_URL}/loans/${id}?key=${key}`,
            loan
        );
    }

    delete_loan(id) {
        return web.delete(
            `${BASE_URL}/loans/${id}?key=${key}`
        );
    }

    // --- Bills ---------------------------------------------------------

    get_bills_for_customer(customerId) {
        return web.get(
            `${BASE_URL}/customers/${customerId}/bills?key=${key}`
        );
    }

    get_bills_for_account(accountId) {
        return web.get(
            `${BASE_URL}/accounts/${accountId}/bills?key=${key}`
        );
    }

    create_bill_for_account(accountId, bill) {
        return web.post(
            `${BASE_URL}/accounts/${accountId}/bills?key=${key}`,
            bill
        );
    }

    get_bill_by_id(billId) {
        return web.get(
            `${BASE_URL}/bills/${billId}?key=${key}`
        );
    }

    update_bill(billId, bill) {
        return web.put(
            `${BASE_URL}/bills/${billId}?key=${key}`,
            bill
        );
    }

    delete_bill(billId) {
        return web.delete(
            `${BASE_URL}/bills/${billId}?key=${key}`
        );
    }

    // --- Merchants -----------------------------------------------------

    get_merchants() {
        return web.get(
            `${BASE_URL}/merchants?key=${key}`
        );
    }

    create_merchant(merchant) {
        return web.post(
            `${BASE_URL}/merchants?key=${key}`,
            merchant
        );
    }

    get_merchant_by_id(id) {
        return web.get(
            `${BASE_URL}/merchants/${id}?key=${key}`
        );
    }

    update_merchant(id, merchant) {
        return web.put(
            `${BASE_URL}/merchants/${id}?key=${key}`,
            merchant
        );
    }

    // --- ATMs ------------------------------------------------------------

    get_atms() {
        return web.get(
            `${BASE_URL}/atms?key=${key}`
        );
    }

    get_atm_by_id(id) {
        return web.get(
            `${BASE_URL}/atms/${id}?key=${key}`
        );
    }

    // --- Branches ------------------------------------------------------

    get_branches() {
        return web.get(
            `${BASE_URL}/branches?key=${key}`
        );
    }

    get_branch_by_id(id) {
        return web.get(
            `${BASE_URL}/branches/${id}?key=${key}`
        );
    }
}

export default new Nessie();
