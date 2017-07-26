//Dropdown Section
var mortgage = false;
var mortgageCheckYes = $("#switch_left");
var mortgageCheckNo = $("#switch_right");
mortgageCheckYes.click(function(){
	$("#dropdown").slideDown(600);
	mortgage = true;
});
mortgageCheckNo.click(function(){
	$("#dropdown").slideUp(600);
	mortgage = false;
});

//calculate click function
$("#calculateBtn").click(function() {
	if(validate() === true) {
		collectInput();
		createArrays();
		drawChart();
		$("#chart_div").removeClass("hide");
		drawChart();
		window.scrollTo(0,document.body.scrollHeight);
	}
	else {
		$(".alert").css("display","block");
	}
});

//Checks if inputs are valid
function validate() {
	var count = 0
	$(".validate").each(function() {
		if ($(this).val() == '' || isNaN($(this).val()) ) {
			$(this).addClass("invalid");
			count ++;
		}
	})
	if(mortgage){
		$(".validateMortgage").each(function() {
			if ($(this).val() == '' || isNaN($(this).val()) ) {
				$(this).addClass("invalid");
				count ++;
			}
		})
	}
	if(count>0) { 
		return false; 
	}
	return true;
}

// Alert Banner
$(".close").click(function() {
	$(".alert").fadeOut();
});
//Input styles
$(".form-control").focus(function() {
	$(this).addClass("focused");
	$(this).removeClass("invalid");
})
$(".form-control").focusout(function() {
	$(this).removeClass("focused");
})

// Input variables
var term = 31;
var inflation;
var rateOfReturn;
var rentalPayment;
var purchasePrice;
var capitalGrowth;
var OngoinghouseCosts;
var loanAmount;
var mortgageRate;
var termOfLoan;
var mortgagePayment;
var rentalArray = [];
var houseValueArray = [];
var investmentArray = [];
var expenseArray = [];
var	rentDifferenceArray = [];
var buyDifferenceArray = [];
var savingsArray = [];
var npvOutflowArray = [];
var npvArray = [];
var npvRentArray = [];
var npvBuyArray = [];

function collectInput() {
	inflation = Number($("#inflation").val()) / 100;
	rateOfReturn = Number($("#rateOfReturn").val()) / 100;
	rentalPayment = Number($("#rentalPayment").val()) * 52;
	purchasePrice = Number($("#purchasePrice").val());
	capitalGrowth = Number($("#capitalGrowth").val()) / 100;
	ongoingHouseCosts = Number($("#rates").val()) + Number($("#insurance").val()) + Number($("#maintenance").val());
	loanAmount = Number($("#loanAmount").val());
	mortgageRate = Number($("#mortgageRate").val()) / 1200;
	termOfLoan = Number($("#termOfLoan").val());
}

function createArrays() {
	if(mortgage) {
		calculateMortgage();
	}
	else {
		loanAmount = 0;
		mortgagePayment = 0;
	}
	createInputArrays();
	createSavings();
	createInvestment();
	generateNPV();
} 

function createInputArrays() {
	rentalArray[0] = 0;
	houseValueArray[0] = purchasePrice;
	expenseArray[0] = 0;
	npvOutflowArray[0] = 0;
	rentDifferenceArray[0] = 0;
	buyDifferenceArray[0] = 0;
	for(var i = 1; i < term; i++) {
		rentalArray[i] = Math.round(rentalPayment * ((inflation+1) ** (i-1)));
		houseValueArray[i] = Math.round(purchasePrice * ((capitalGrowth+1) ** i));
		expenseArray[i] = Math.round(ongoingHouseCosts * ((inflation+1) ** (i-1)));
		npvOutflowArray[i] = Math.max(mortgagePayment + expenseArray[i], rentalArray[i]);
		rentDifferenceArray[i] = npvOutflowArray[i] - rentalArray[i];
		buyDifferenceArray[i] = npvOutflowArray[i] - (mortgagePayment + expenseArray[i]);
	}
}

function createInvestment() {
	investmentArray[0] = 0;
	investmentArray[1] = Math.round((purchasePrice - loanAmount + rentDifferenceArray[1]) * (rateOfReturn+1));
	for(var i = 2; i < term; i++) {
		investmentArray[i] = Math.round((investmentArray[i-1] + rentDifferenceArray[i]) * (rateOfReturn+1));
	}
}
function createSavings() {
	savingsArray[0] = 0;
	savingsArray[1] = buyDifferenceArray[1] * (1+rateOfReturn);
	for(var i = 2; i < term; i++) {
		savingsArray[i] = Math.round((savingsArray[i-1] + buyDifferenceArray[i]) * (1+rateOfReturn));
	}
}

function calculateMortgage() {
	var nPeriods = termOfLoan * 12;
	var numerator = mortgageRate * ((1+mortgageRate)**nPeriods);
	var denominator = ((1+mortgageRate)**nPeriods) - 1;
	var yearlyPayment = (loanAmount * (numerator / denominator)) * 12;
	mortgagePayment = yearlyPayment;
}

function generateNPV() {
	var slot = 0;
	//change to i < 31
	for(var i=5; i < 30; i++) {
		npvRentArray[slot] = rentNPV(i);
		npvBuyArray[slot] = buyNPV(i);
		npvArray[slot] = npvRentArray[slot] - npvBuyArray[slot];
		slot++;
	}
}

function rentNPV(years) {
	var discountRate = (1 + rateOfReturn - inflation);
	var finalPayment = investmentArray[years] - npvOutflowArray[years];
	var finalPaymentD = Math.round(finalPayment / (discountRate)**years);
	var initial = purchasePrice - loanAmount;
	var sum = finalPaymentD - initial;
	for(var i = 1; i < years; i++) {
		sum -= npvOutflowArray[i] / (discountRate)** i;
	}
	return Math.round(sum);
}

function buyNPV(years) {
	var discountRate = (1 + rateOfReturn - inflation);
	if(mortgage) {
		var component = (1+mortgageRate)**(years*12);
		var outstandingLoan = loanAmount*component - (mortgagePayment/12)*((component-1)/mortgageRate);
		var finalPayment = houseValueArray[years] + savingsArray[years] - npvOutflowArray[years] - outstandingLoan;
	}
	else {
		var finalPayment = houseValueArray[years] + savingsArray[years] - npvOutflowArray[years];
	}
	var finalPaymentD = Math.round(finalPayment / (discountRate)**years);
	var initial = purchasePrice - loanAmount;
	var sum = finalPaymentD - initial;
	for(var i = 1; i < years; i++) {
		sum -= npvOutflowArray[i] / (discountRate)** i;
	}
	return Math.round(sum);
}

//result chart
google.charts.load('current', {'packages':['corechart']});
function drawChart() {
	var rent = [];
	var buy = [];
	for(var i=0; i<16; i++) {
		rent[i] = 0;
		buy[i] = 0;
	}
	var chartTitle = "You should... It depends on your timeframe";
	if((npvArray[0] > 0) && (npvArray[20] > 0)) {
		chartTitle = "You should... Rent!";
		rent = npvArray;
	}
	else if((npvArray[0] < 0) && (npvArray[20] < 0)) {
		chartTitle = "You should... Buy!";
		for(var i=0; i<16; i++) {
			buy[i] = Math.abs(npvArray[i]);
		}

	}
	else { 
		rent = npvArray;
	}

   var data = google.visualization.arrayToDataTable([
  
        ['Year', 'Rent', 'Buy'],
        ['5',  rent[0], buy[0]],
        ['6',  rent[1], buy[1]],
        ['7',  rent[2], buy[2]],
        ['8',  rent[3], buy[3]],
        ['9',  rent[4], buy[4]],
        ['10',  rent[5], buy[5]],
        ['11',  rent[6], buy[6]],
        ['12',  rent[7], buy[7]],
        ['13',  rent[8], buy[8]],
        ['14',  rent[9], buy[9]],
        ['15',  rent[10], buy[10]],
        ['16',  rent[11], buy[11]],
        ['17',  rent[12], buy[12]],
        ['18',  rent[13], buy[13]],
        ['19',  rent[14], buy[14]],
        ['20',  rent[15], buy[15]]
        ]);

    var options = {
      title: chartTitle, titleTextStyle: {
      	color: "#2F86A3",
      	fontSize: 20,
      	bold: false
      },
      hAxis: {
      	title: 'Investment Term', titleTextStyle: {color: '#333'}},
        vAxis: {title: 'Relative Savings', minValue: 0, gridlines: {color: "#ccc"}},
        legend: {position: 'top'}
    };

    var chart = new google.visualization.AreaChart(document.getElementById('chart_div'));
    chart.draw(data, options);
}
//scales chart on resize
window.onresize = drawChart;
