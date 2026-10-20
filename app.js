const form = document.querySelector("#converter-form");
const amountInput = document.querySelector("#amount");
const fromSelect = document.querySelector("#from-currency");
const toSelect = document.querySelector("#to-currency");
const fromFlag = document.querySelector("#from-flag");
const toFlag = document.querySelector("#to-flag");
const result = document.querySelector("#result");
const errorMessage = document.querySelector("#error-message");
const convertButton = document.querySelector("#convert-button");
const swapButton = document.querySelector("#swap-currencies");

const flagCountries = {
    AED: "AE", AUD: "AU", BRL: "BR", CAD: "CA", CHF: "CH", CNY: "CN",
    DKK: "DK", EUR: "DE", GBP: "GB", HKD: "HK", IDR: "ID", INR: "IN",
    JPY: "JP", KRW: "KR", MXN: "MX", NOK: "NO", NZD: "NZ", PLN: "PL",
    SEK: "SE", SGD: "SG", THB: "TH", TRY: "TR", USD: "US", ZAR: "ZA",
};

let requestNumber = 0;

function updateFlag(select, image) {
    const countryCode = flagCountries[select.value];
    image.src = `https://flagsapi.com/${countryCode}/flat/64.png`;
    image.alt = `${select.value} flag`;
}

function formatCurrency(value, currency) {
    return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(value);
}

async function convertCurrency(event) {
    event?.preventDefault();

    const requestId = ++requestNumber;
    const rawAmount = amountInput.value.trim();
    const amount = Number(rawAmount);
    if (!rawAmount || !Number.isFinite(amount) || amount < 0) {
        errorMessage.textContent = "Enter a valid amount greater than or equal to zero.";
        errorMessage.hidden = false;
        convertButton.disabled = false;
        convertButton.textContent = "Get exchange rate";
        return;
    }

    const fromCurrency = fromSelect.value;
    const toCurrency = toSelect.value;
    errorMessage.hidden = true;
    convertButton.disabled = true;
    convertButton.textContent = "Getting rate…";
    result.textContent = "Getting exchange rate…";

    try {
        let rate = 1;
        let rateDate = "";
        if (fromCurrency !== toCurrency) {
            const response = await fetch(
                `https://api.frankfurter.dev/v2/rate/${encodeURIComponent(fromCurrency.toLowerCase())}/${encodeURIComponent(toCurrency.toLowerCase())}`
            );
            if (!response.ok) {
                throw new Error(`Exchange-rate service returned ${response.status}.`);
            }

            const data = await response.json();
            rate = data.rate;
            rateDate = data.date;
            if (!Number.isFinite(rate)) {
                throw new Error("The exchange-rate service did not return a rate for this currency pair.");
            }
        }

        if (requestId !== requestNumber) return;

        result.textContent = `${formatCurrency(amount, fromCurrency)} = ${formatCurrency(amount * rate, toCurrency)}${rateDate ? `\n1 ${fromCurrency} = ${rate} ${toCurrency} (rate dated ${rateDate})` : ""}`;
        result.setAttribute("aria-label", `${formatCurrency(amount, fromCurrency)} equals ${formatCurrency(amount * rate, toCurrency)}${rateDate ? `, rate dated ${rateDate}` : ""}`);
    } catch (error) {
        if (requestId !== requestNumber) return;
        errorMessage.textContent = `Unable to get the exchange rate. ${error.message}`;
        errorMessage.hidden = false;
    } finally {
        if (requestId === requestNumber) {
            convertButton.disabled = false;
            convertButton.textContent = "Get exchange rate";
        }
    }
}

fromSelect.addEventListener("change", () => {
    updateFlag(fromSelect, fromFlag);
    convertCurrency();
});
toSelect.addEventListener("change", () => {
    updateFlag(toSelect, toFlag);
    convertCurrency();
});
swapButton.addEventListener("click", () => {
    const previousFrom = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = previousFrom;
    updateFlag(fromSelect, fromFlag);
    updateFlag(toSelect, toFlag);
    convertCurrency();
});
form.addEventListener("submit", convertCurrency);

convertCurrency();
