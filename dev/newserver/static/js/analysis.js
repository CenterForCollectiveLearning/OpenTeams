var panel_ind = 0, panel_count = 8; // 0 for table, 1 for axis, 2 for pairs
var pair_p1 = "All", pair_p2 = "All";
var coordinates_data;
var histo2_done = 0, senttime_done = 0, summary_done = 0;
var major_selected = 'major_college', major_dim_selected = "Gender";

var idToNeighbors = {};
var indexToNeighbors = {};
var coordinates_xMap, coordinates_yMap;

var coordinates_x_scale = "linear", coordinates_y_scale = "linear";
var average_personality = {'Open-Mindedness': 0, 'Conscientiousness': 0, 'Extraversion': 0, 'Agreeableness': 0, 'Negative Emotionality': 0}, 
    ci_personality = {'Open-Mindedness': [0,0], 'Conscientiousness': [0,0], 'Extraversion': [0,0], 'Agreeableness': [0,0], 'Negative Emotionality': [0,0]}, 
    ci_morality = {'Harm': [0,0], 'Fairness': [0,0], 'Purity': [0,0], 'Authority': [0,0], 'Loyalty': [0,0]}, 
    average_morality = {'Fairness': 0, 'Harm': 0, 'Loyalty':0, 'Authority': 0, 'Purity': 0, }, 
    average_demographics = {'Age': 0};

var demo_people_names_match = {
    "Jingxian Zhang": "Alice", "Sanjay Guruprasad": "Robin Hood", "Bogang Jun": "Woggle-Bug", 
    "Teresa Fernandes": "Sherlock Holmes",
    // "Cesar Hidalgo": "John Carter", //"Cesar A. Hidalgo": "Evangaline", 
    "Flávio Pinheiro": "Mystico", "Diana Orghian": "Captain Nemo", "Andrea Margit": "Tin Woodman",
    "Kevin Hu": "Dorothy Gale", //"Kevin Zeng Hu": "Queen Narissa", 
    "Cristian Figueroa": "Scarecrow", //"Cristian Jara Figueroa": "Red", 
    "Almaha Almalki": "Jack Pumpkinhead", //"Almaha Adnan Almalki": "Duncan",
    "Cristian Vallejos": "Long John Silver",//, "Cristian Esteban Candia Vallejos": "Roquefort the Mouse"
};

var continents_countries = {
    "Africa": ["Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cameroon", "Cape Verde", "Central African Republic", "Chad", "Comoros", "Republic of the Congo", "Democratic Republic of the Congo", "Ivory Coast", "Djibouti", "Egypt", "Equatorial Guinea", "Eritrea", "Ethiopia", "Gabon", "The Gambia", "Ghana", "Guinea", "Guinea-Bissau", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda", "São Tomé and Príncipe", "Senegal", "Seychelles", "Sierra Leone", "Somalia", "South Africa", "South Sudan", "Sudan", "Swaziland", "Tanzania", "Togo", "Tunisia", "Uganda", "Western Sahara", "Zambia", "Zimbabwe"],
    "Asia": ["Afghanistan", "Armenia", "Azerbaijan", "Bahrain", "Bangladesh", "Bhutan", "Brunei", "Cambodia", "China", "Taiwan", "East Timor", "Georgia", "India", "Indonesia", "Iran", "Iraq", "Israel", "Palestine", "Japan", "Jordan", "Kazakhstan", "Kuwait", "Kyrgyzstan", "Laos", "Lebanon", "Malaysia", "Maldives", "Mongolia", "Myanmar", "Nepal", "North Korea", "Oman", "Pakistan", "Philippines", "Qatar", "Russia", "Saudi Arabia", "Singapore", "South Korea", "Sri Lanka", "Syria", "Tajikistan", "Thailand", "Turkey", "Turkmenistan", "United Arab Emirates", "Uzbekistan", "Vietnam", "Yemen"],
    "Europe": ["Albania", "Andorra", "Austria", "Belarus", "Belgium", "Bosnia and Herzegovina", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Iceland", "Republic of Ireland", "Italy", "Kosovo", "Latvia", "Liechtenstein", "Lithuania", "Luxembourg", "Macedonia", "Malta", "Moldova", "Monaco", "Montenegro", "Netherlands", "Norway", "Poland", "Portugal", "Romania", "Russia", "San Marino", "Serbia", "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland", "Ukraine", "United Kingdom", "Vatican City"],
    "North America": ["Canada", "Greenland", "United States", "Mexico"],
    "Central America": ["Antigua and Barbuda", "The Bahamas", "Barbados", "Belize", "Costa Rica", "Cuba", "Curacao", "Dominica", "Dominican Republic", "El Salvador", "Grenada", "Guatemala", "Haiti", "Honduras", "Jamaica", "Nicaragua", "Panama", "Puerto Rico", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Trinidad and Tobago", "Turks and Caicos"],
    "South America": ["Argentina", "Bolivia", "Brazil", "Chile", "Colombia", "Ecuador", "French Guiana", "Guyana", "Paraguay", "Peru", "Suriname", "Uruguay", "Venezuela"],
    "Oceania": ["Australia", "Federated States of Micronesia", "Fiji", "Kiribati", "Marshall Islands", "Nauru", "New Zealand", "Palau", "Papua New Guinea", "Samoa", "Solomon Islands", "Tonga", "Tuvalu", "Vanuatu"]
};
var continents_colors = {
    "Africa": "#224f20", //rgb(34,79,32)
    "Asia": "#b22200", //rgb(178,34,0)
    "Europe": "#993588", //rgb(153,53,136)
    "North America": "#282b75", //rgb(40,47,107)
    "Central America": "#759143", //rgb(117,145,67)
    "South America": "#b35c1e", //rgb(179,92,30)
    "Oceania": "#419391" //rgb(65,147,145)
}


function photo(name){
    var userinfo = $.grep(usersinfo, function (e) { return e.name == name; });
    if (name != "Kevin Hu" && userinfo[0]['picture'] !== undefined) {
         return userinfo[0]['picture'];
    } else {
        if(userinfo[0].name == "Almaha Almalki") return (demo == 1 ? "/static/images/" + demo_people_names_match[userinfo[0].name] + ".png" : "/static/images/demo_maha.png");
        else if(userinfo[0].name == "Sanjay Guruprasad") return (demo == 1 ? "/static/images/" + demo_people_names_match[userinfo[0].name] + ".png" : "/static/images/demo_sanjay.png");
        else if(userinfo[0].name == "Jingxian Zhang") return (demo == 1 ? "/static/images/" + demo_people_names_match[userinfo[0].name] + ".png" : "/static/images/demo_jingxian.png");
        else if(userinfo[0].name == "Cesar Hidalgo" || userinfo[0].name == "Cesar A. Hidalgo") return (demo == 1 ? "/static/images/" + demo_people_names_match[userinfo[0].name] + ".png" : "/static/images/demo_cesar.png");
        else if(userinfo[0].name == "Kevin Hu" || userinfo[0].name == "Kevin Zeng Hu") return (demo == 1 ? "/static/images/" + demo_people_names_match[userinfo[0].name] + ".png" : "/static/images/demo_kevin.png");
        else return "/static/images/default_user_pic.jpg";
    }
}
var show_personality_results = function(){
    d3.select("#analysis_personality_svg_cover").select("svg").selectAll("*").remove();
    
    var p_margin = {top: 40, right: 70, bottom: 80, left: 80};
    var svg_width = $(window).width() * 0.8 *0.82, svg_height = $(window).height() * 0.8;
    var p_width = svg_width - p_margin.left - p_margin.right, p_height = svg_height - p_margin.top - p_margin.bottom;
    var p_svg = d3.select("#analysis_personality_svg")
        .attr("width", p_width + + p_margin.left + p_margin.right).attr("height", p_height + p_margin.top + p_margin.bottom)
        .append("g").attr("transform", "translate(" + p_margin.left + "," + p_margin.top + ")");
    var xValue = function(d) { return (d == undefined ? 0 : d['Open-Mindedness']);}, // data -> value
        xScale = d3.scale.linear().range([0, p_width]), // value -> display
        xScale_log = d3.scale.log().base(10).range([0, p_width]), 
        xMap = function(d) { return xScale(xValue(d));}, // data -> display
        xAxis = d3.svg.axis().scale(xScale).orient("bottom")
                .tickValues([0, 20, 40, 60, 80, 100]);

    // setup y
    var yValue = function(d) { return (d == undefined? 0: d['Conscientiousness']);}, // data -> value
        yScale = d3.scale.linear().range([p_height, 0]), // value -> display
        yScale_log = d3.scale.log().base(10).range([p_height, 0]), 
        yMap = function(d) { return yScale(yValue(d));}, // data -> display
        yAxis = d3.svg.axis().scale(yScale).orient("left")
                .tickValues([0, 20, 40, 60, 80, 100]);
    var p_data = new Array(usersinfo.length);
    for(var p = 0; p < usersinfo.length; p++){
        p_data[p] = {'Open-Mindedness': -100,
                     'Conscientiousness': -100,
                     'Extraversion': -100,
                     'Agreeableness': -100,
                     'Negative Emotionality': -100,
                     //morality dimensions next
                     'Fairness': -100,
                     'Harm': -100,
                     'Loyalty': -100,
                     'Authority': -100,
                     'Purity': -100
                 };
    }
    var num = 0, num2 = 0;
    var reducer = function(a, b) { return a + b; };
    var all_personality = {'Open-Mindedness': [],
                     'Conscientiousness': [],
                     'Extraversion': [],
                     'Agreeableness': [],
                     'Negative Emotionality': []};
    var all_morality = {'Fairness': [],
                     'Harm': [],
                     'Loyalty': [],
                     'Authority': [],
                     'Purity': []};
    for(var p = 0; p < usersinfo.length; p++){
        if(JSON.stringify(personalities[p]) != JSON.stringify({})){
            p_data[p]['Open-Mindedness'] = personalities[p]['personality']['Open-Mindedness'];
            p_data[p]['Conscientiousness'] = personalities[p]['personality']['Conscientiousness'];
            p_data[p]['Extraversion'] = personalities[p]['personality']['Extraversion'];
            p_data[p]['Agreeableness'] = personalities[p]['personality']['Agreeableness'];
            p_data[p]['Negative Emotionality'] = personalities[p]['personality']['Negative Emotionality'];
            p_data[p]['Degree'] = centralities[p]['degree'];
            p_data[p]['Betweenness'] = parseFloat(centralities[p]['betweenness'].toFixed(5));
            p_data[p]['Age'] = personalities[p]['demographics']['age'];
            p_data[p]['Gender'] = personalities[p]['demographics']['gender'];

            average_personality['Open-Mindedness'] += parseFloat(personalities[p]['personality']['Open-Mindedness']);
            average_personality['Conscientiousness'] += parseFloat(personalities[p]['personality']['Conscientiousness']);
            average_personality['Extraversion'] += parseFloat(personalities[p]['personality']['Extraversion']);
            average_personality['Agreeableness'] += parseFloat(personalities[p]['personality']['Agreeableness']);
            average_personality['Negative Emotionality'] += parseFloat(personalities[p]['personality']['Negative Emotionality']);
            average_demographics['Age'] += parseFloat(personalities[p]['demographics']['age']);

            all_personality['Open-Mindedness'].push(parseFloat(personalities[p]['personality']['Open-Mindedness']));
            all_personality['Conscientiousness'].push(parseFloat(personalities[p]['personality']['Conscientiousness']));
            all_personality['Extraversion'].push(parseFloat(personalities[p]['personality']['Extraversion']));
            all_personality['Agreeableness'].push(parseFloat(personalities[p]['personality']['Agreeableness']));
            all_personality['Negative Emotionality'].push(parseFloat(personalities[p]['personality']['Negative Emotionality']));

            num++;
        }

        if('Harm' in moralities[p]){
            p_data[p]['Fairness'] = moralities[p]['Fairness'];
            p_data[p]['Harm'] = moralities[p]['Harm'];
            p_data[p]['Loyalty'] = moralities[p]['Loyalty'];
            p_data[p]['Authority'] = moralities[p]['Authority'];
            p_data[p]['Purity'] = moralities[p]['Purity'];
            
            average_morality['Fairness'] += parseFloat(moralities[p]['Fairness']);
            average_morality['Harm'] += parseFloat(moralities[p]['Harm']);
            average_morality['Loyalty'] += parseFloat(moralities[p]['Loyalty']);
            average_morality['Authority'] += parseFloat(moralities[p]['Authority']);
            average_morality['Purity'] += parseFloat(moralities[p]['Purity']);
            
            all_morality['Fairness'].push(parseFloat(moralities[p]['Fairness']));
            all_morality['Harm'].push(parseFloat(moralities[p]['Harm']));
            all_morality['Loyalty'].push(parseFloat(moralities[p]['Loyalty']));
            all_morality['Authority'].push(parseFloat(moralities[p]['Authority']));
            all_morality['Purity'].push(parseFloat(moralities[p]['Purity']));

            num2++;
        }
    }
    if(num != 0){
        average_personality['Open-Mindedness'] /= num;
        average_personality['Conscientiousness'] /= num;
        average_personality['Extraversion'] /= num;
        average_personality['Agreeableness'] /= num;
        average_personality['Negative Emotionality'] /= num;
        average_demographics['Age'] /= num;

        var x_ave0 = all_personality['Open-Mindedness'].reduce(reducer) / all_personality['Open-Mindedness'].length,
            x_ave1 = all_personality['Conscientiousness'].reduce(reducer) / all_personality['Conscientiousness'].length,
            x_ave2 = all_personality['Extraversion'].reduce(reducer) / all_personality['Extraversion'].length,
            x_ave3 = all_personality['Agreeableness'].reduce(reducer) / all_personality['Agreeableness'].length,
            x_ave4 = all_personality['Negative Emotionality'].reduce(reducer) / all_personality['Negative Emotionality'].length;
        var x_square0 = all_personality['Open-Mindedness'].map(function(d) { return Math.pow(d - x_ave0, 2); }).reduce(reducer) / num,
            x_square1 = all_personality['Conscientiousness'].map(function(d) { return Math.pow(d - x_ave1, 2); }).reduce(reducer) / num,
            x_square2 = all_personality['Extraversion'].map(function(d) { return Math.pow(d - x_ave2, 2); }).reduce(reducer) / num,
            x_square3 = all_personality['Agreeableness'].map(function(d) { return Math.pow(d - x_ave3, 2); }).reduce(reducer) / num,
            x_square4 = all_personality['Negative Emotionality'].map(function(d) { return Math.pow(d - x_ave4, 2); }).reduce(reducer) / num;
        ci_personality['Open-Mindedness'][0] = x_ave0 - 1.96 * Math.sqrt(x_square0) / Math.sqrt(num);
        ci_personality['Conscientiousness'][0] = x_ave1 - 1.96 * Math.sqrt(x_square1) / Math.sqrt(num);
        ci_personality['Extraversion'][0] = x_ave2 - 1.96 * Math.sqrt(x_square2) / Math.sqrt(num);
        ci_personality['Agreeableness'][0] = x_ave3 - 1.96 * Math.sqrt(x_square3) / Math.sqrt(num);
        ci_personality['Negative Emotionality'][0] = x_ave4 - 1.96 * Math.sqrt(x_square4) / Math.sqrt(num);
        ci_personality['Open-Mindedness'][1] = x_ave0 + 1.96 * Math.sqrt(x_square0) / Math.sqrt(num);
        ci_personality['Conscientiousness'][1] = x_ave1 + 1.96 * Math.sqrt(x_square1) / Math.sqrt(num);
        ci_personality['Extraversion'][1] = x_ave2 + 1.96 * Math.sqrt(x_square2) / Math.sqrt(num);
        ci_personality['Agreeableness'][1] = x_ave3 + 1.96 * Math.sqrt(x_square3) / Math.sqrt(num);
        ci_personality['Negative Emotionality'][1] = x_ave4 + 1.96 * Math.sqrt(x_square4) / Math.sqrt(num);
    }

    if(num2 != 0){
        average_morality['Fairness'] /= num2;
        average_morality['Harm']  /= num2;
        average_morality['Loyalty']  /= num2;
        average_morality['Authority']  /= num2;
        average_morality['Purity']  /= num2;
        
        var x_ave0 = all_morality['Fairness'].reduce(reducer) / all_morality['Fairness'].length,
            x_ave1 = all_morality['Harm'].reduce(reducer) / all_morality['Harm'].length,
            x_ave2 = all_morality['Loyalty'].reduce(reducer) / all_morality['Loyalty'].length,
            x_ave3 = all_morality['Authority'].reduce(reducer) / all_morality['Authority'].length,
            x_ave4 = all_morality['Purity'].reduce(reducer) / all_morality['Purity'].length;
        var x_square0 = all_morality['Fairness'].map(function(d) { return Math.pow(d - x_ave0, 2); }).reduce(reducer) / num2,
            x_square1 = all_morality['Harm'].map(function(d) { return Math.pow(d - x_ave1, 2); }).reduce(reducer) / num2,
            x_square2 = all_morality['Loyalty'].map(function(d) { return Math.pow(d - x_ave2, 2); }).reduce(reducer) / num2,
            x_square3 = all_morality['Authority'].map(function(d) { return Math.pow(d - x_ave3, 2); }).reduce(reducer) / num2,
            x_square4 = all_morality['Purity'].map(function(d) { return Math.pow(d - x_ave4, 2); }).reduce(reducer) / num2;
        ci_morality['Fairness'][0] = x_ave0 - 1.96 * Math.sqrt(x_square0) / Math.sqrt(num2);
        ci_morality['Harm'][0] = x_ave1 - 1.96 * Math.sqrt(x_square1) / Math.sqrt(num2);
        ci_morality['Loyalty'][0] = x_ave2 - 1.96 * Math.sqrt(x_square2) / Math.sqrt(num2);
        ci_morality['Authority'][0] = x_ave3 - 1.96 * Math.sqrt(x_square3) / Math.sqrt(num2);
        ci_morality['Purity'][0] = x_ave4 - 1.96 * Math.sqrt(x_square4) / Math.sqrt(num2);
        ci_morality['Fairness'][1] = x_ave0 + 1.96 * Math.sqrt(x_square0) / Math.sqrt(num2);
        ci_morality['Harm'][1] = x_ave1 + 1.96 * Math.sqrt(x_square1) / Math.sqrt(num2);
        ci_morality['Loyalty'][1] = x_ave2 + 1.96 * Math.sqrt(x_square2) / Math.sqrt(num2);
        ci_morality['Authority'][1] = x_ave3 + 1.96 * Math.sqrt(x_square3) / Math.sqrt(num2);
        ci_morality['Purity'][1] = x_ave4 + 1.96 * Math.sqrt(x_square4) / Math.sqrt(num2);
    }

    coordinates_data = p_data;
    xScale.domain([0, 100]); //d3.min(p_data, xValue)-1, d3.max(p_data, xValue)+1
    yScale.domain([0, 100]); //d3.min(p_data, yValue)-1, d3.max(p_data, yValue)+1
    xScale_log.domain([0.1, 100]); 
    yScale_log.domain([0.1, 100]);
    coordinates_xMap = xMap; coordinates_yMap = yMap;

    var colors = ['rgb(27, 70, 108)', "#D88520", "#D4D820", 'rgb(171, 43, 43)', "#20CFD8", "#ffffff"];
    var h = 150, w = 50;
    var key = d3.select("svg#legend_color");
    var legend = key.append("defs").attr("id", "defsGradient").append("svg:linearGradient").attr("id", "gradient").attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%").attr("spreadMethod", "pad");
    legend.append("stop").attr("id", "stop1").attr("offset", "0%").attr("stop-color", colors[2]).attr("stop-opacity", 1);
    legend.append("stop").attr("id", "stop0").attr("offset", "100%").attr("stop-color", colors[2]).attr("stop-opacity", 0);
    key.append("rect").attr("id", "gradient_rect").attr("width", w-25).attr("height", h-20).style("fill", "url(#gradient)").attr("transform", "translate(0,10)").style("display", "none");
    var y2 = d3.scale.linear().range([0, h-20]).domain([100, 0]);
    var yAxis2 = d3.svg.axis().scale(y2).orient("right").ticks(3);
    key.append("g").attr("class", "y2 axis").attr("id", "gradient_y_axis").attr("transform", "translate(25,10)").call(yAxis2).style("display", "none");
    key.selectAll("path").style("display", "none");

    var for_gender = key.append("g").attr("id", "for_gender").attr("transform", "translate(0,10)").style("display", "block");
    for_gender.append("rect").attr("id", "gender_f").attr("y", 20).attr("width", w-25).attr("height", w-25).style("fill", 'rgb(171, 43, 43)');
    for_gender.append("text").attr("x", 8).attr("y", 20 + 15).text("F");
    for_gender.append("rect").attr("id", "gender_m").attr("y", 90).attr("width", w-25).attr("height", w-25).style("fill", 'rgb(27, 70, 108)');
    for_gender.append("text").attr("x", 8).attr("y", 90 + 15).text("M");
    
    var legend_size = d3.select("svg#legend_size");
    d3.range(4).forEach(function (i) {
        legend_size.append("circle")
            .attr("r", 4 + (3 - i) * 4)
            .attr("cx", 25).attr("cy", 42 + (60 - 8 * i) * i / 2 + i * 13 - (4 + (3 - i) * 4))
            .style("fill", "rgb(255,255,255)");
        legend_size.append("text").attr("class", "ctag").attr("id", "ctag_" + i)
            .attr("x", 45).attr("y", 45 + (60 - 8 * i) * i / 2 + i * 13 - (4 + (3 - i) * 4))
            .text(parseInt((3 - i) *33 + 1));
    });

    d3.select("#x_scale").select("#by_linear").on("click", function(){
        coordinates_x_scale = "linear";
        d3.select("#x_scale").select("#by_log").style("background-color", "rgba(184,184,184,0)");
        d3.select("#x_scale").select("#by_linear").style("background-color", "rgba(184,184,184,1)");
        var value = document.getElementById("xSelect").value;
        if(value.indexOf(')') != -1){
            value = value.substring(value.indexOf(')') + 2, value.length);
        }

        switch(value){
            case 'Degree': 
                xScale = d3.scale.linear().range([0, p_width]).nice();
                xScale.domain([d3.min(p_data, function(d){ return d[value];})-10<0? 0:d3.min(p_data, function(d){ return d[value];})-10, d3.max(p_data, function(d){ return d[value];})]); 
                var formatNumber = d3.format(",.0f");
                xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(4, function(d) { return formatNumber(d) });
                break;
            case 'Betweenness': 
                xScale = d3.scale.linear().range([0, p_width]).nice();
                xScale.domain([(d3.min(p_data, function(d){ return d[value];})-0.1<0 ? 0 : d3.min(p_data, function(d){ return d[value];}))-0.1, d3.max(p_data, function(d){ return d[value];})]); 
                var formatNumber = d3.format(",.4f");
                xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(4, function(d) { return formatNumber(d) });
                break;
            case 'Gender':  
                xScale = d3.scale.ordinal().range([0, p_width]).nice();
                xScale.domain(['m', 'f']); 
                xAxis = d3.svg.axis().scale(xScale).orient("bottom");
                break;
            case 'Age':  
                xScale = d3.scale.linear().range([0, p_width]).nice();
                xScale.domain([d3.min(p_data, function(d){ return d[value];}) - 1, d3.max(p_data, function(d){ return d[value];}) + 1]); 
                var formatNumber = d3.format(",.0f");
                xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(5, function(d) { return formatNumber(d) });
                break;
            case 'Fairness':
            case 'Harm':
            case 'Loyalty':
            case 'Authority':
            case 'Purity':
                xScale = d3.scale.linear().range([0, p_width]).nice();
                xScale.domain([0, 5]); 
                var formatNumber = d3.format(",.1f");
                xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(5, function(d) { return formatNumber(d) });
                break; 
            default: 
                xScale = d3.scale.linear().range([0, p_width]).nice();
                xScale.domain([0, 100]); 
                var formatNumber = d3.format(",.0f");
                xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(5, function(d) { return formatNumber(d) });
                break; 
        }

        // xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(4);
        d3.select("#analysis_personality_svg_cover").select(".x.axis")
          .transition().duration(500)
          .call(xAxis);
        d3.select("#analysis_personality_svg_cover").selectAll('.dot') // move the circles
          .attr("opacity", function (d) { return isNaN(xScale(d[value]))? 0:1; })
          .transition().duration(500)
          .attr('cx',function (d) { return isNaN(xScale(d[value]))? -1000:xScale(d[value]); });
        d3.select("#analysis_personality_svg_cover").selectAll('.links') // move the circles
          .style("visibility", function (d) { 
            var id_pair = d3.select(this).attr("id");
            var n1 = id_pair.substring(id_pair.indexOf('link') + 4, id_pair.indexOf('_')), n2 = id_pair.substring(id_pair.indexOf('_')+1, id_pair.length);
            return isNaN(xScale(coordinates_data[n1][value]))||isNaN(xScale(coordinates_data[n2][value]))||coordinates_data[n1][value]<0||coordinates_data[n2][value]<0? "hidden":"visible"; 
        })
          .transition().duration(500)
          .attr('x1',function () { 
            var id_pair = d3.select(this).attr("id");
            var n1 = id_pair.substring(id_pair.indexOf('link') + 4, id_pair.indexOf('_')), n2 = id_pair.substring(id_pair.indexOf('_')+1, id_pair.length);
            return isNaN(xScale(coordinates_data[n1][value]))? -1000:xScale(coordinates_data[n1][value]); 
        }).attr('x2',function () { 
            var id_pair = d3.select(this).attr("id");
            var n1 = id_pair.substring(id_pair.indexOf('link') + 4, id_pair.indexOf('_')), n2 = id_pair.substring(id_pair.indexOf('_')+1, id_pair.length);
            return isNaN(xScale(coordinates_data[n2][value]))? -1000:xScale(coordinates_data[n2][value]); 
        });
        d3.select("#analysis_personality_svg_cover").selectAll('.dot_text') // move the circles
          .attr("opacity", function (d) { return isNaN(xScale(d[value]))? 0:1; })
          .transition().duration(500)
          .attr('x',function (d) { return (isNaN(xScale(d[value]))? -1000:xScale(d[value])) - 6; });

        if(value != "Gender"){
            var other_value = document.getElementById("ySelect").value;
            if(other_value.indexOf(')') != -1){
                other_value = other_value.substring(other_value.indexOf(')') + 2, other_value.length);
            }
            var this_xscale = xScale;
            var this_yscale = update_yAxis(other_value);
            var trendline = getTrendline(value, other_value, "all");
            if(trendline != null){
                var trend_x1 = this_xscale.domain()[0];
                var trend_y1 = trendline[0] * (coordinates_x_scale == "log"? Math.log10(this_xscale.domain()[0]) : this_xscale.domain()[0]) + trendline[1];
                var trend_x2 = this_xscale.domain()[1];
                var trend_y2 = trendline[0] * (coordinates_x_scale == "log"? Math.log10(this_xscale.domain()[1]) : this_xscale.domain()[1]) + trendline[1];
                p_svg.select(".trendline").transition().duration(500)
                    // .attr("x1", function(d) { 
                    //     return trend_y1 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (this_yscale.domain()[0] - trendline[1]) / trendline[0]) : (this_yscale.domain()[0] - trendline[1]) / trendline[0]) : this_xscale(trend_x1); 
                    // })
                    // .attr("y1", function(d) { 
                    //     return trend_y1 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(trend_y1); 
                    // })
                    // .attr("x2", function(d) { 
                    //     return trend_y2 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (this_yscale.domain()[0] - trendline[1]) / trendline[0]) : (this_yscale.domain()[0] - trendline[1]) / trendline[0]) : this_xscale(trend_x2); 
                    // })
                    // .attr("y2", function(d) { 
                    //     return trend_y2 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(trend_y2); 
                    // })
                    .attr("x1", function(d) { 
                        if(coordinates_y_scale == "log"){
                            return Math.pow(10, trend_y1) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - trendline[1]) / trendline[0]) : (Math.log10(this_yscale.domain()[0]) - trendline[1]) / trendline[0]) : this_xscale(trend_x1); 
                        }
                        else
                            return trend_y1 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (this_yscale.domain()[0] - trendline[1]) / trendline[0]) : (this_yscale.domain()[0] - trendline[1]) / trendline[0]) : this_xscale(trend_x1); 
                        // return Math.pow(10, trend_y1) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - trendline[1]) / trendline[0]) : (Math.log10(this_yscale.domain()[0]) - trendline[1]) / trendline[0]) : this_xscale(trend_x1); 
                    })
                    .attr("y1", function(d) { 
                        if(coordinates_y_scale == "log"){
                            return Math.pow(10, trend_y1) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, trend_y1)); 
                        }
                        else
                            return trend_y1 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(trend_y1);    
                        // return Math.pow(10, trend_y1) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, trend_y1)); 
                    })
                    .attr("x2", function(d) { 
                        if(coordinates_y_scale == "log"){
                            return Math.pow(10, trend_y2) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - trendline[1]) / trendline[0]) : (Math.log10(this_yscale.domain()[0]) - trendline[1]) / trendline[0]) : this_xscale(trend_x2); 
                        }
                        else
                            return trend_y2 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (this_yscale.domain()[0] - trendline[1]) / trendline[0]) : (this_yscale.domain()[0] - trendline[1]) / trendline[0]) : this_xscale(trend_x2); 
                        // return Math.pow(10, trend_y2) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - trendline[1]) / trendline[0]) : (Math.log10(this_yscale.domain()[0]) - trendline[1]) / trendline[0]) : this_xscale(trend_x2); 
                    })
                    .attr("y2", function(d) { 
                        if(coordinates_y_scale == "log"){
                            return Math.pow(10, trend_y2) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, trend_y2)); 
                        }
                        else
                            return trend_y2 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(trend_y2); 
                        // return Math.pow(10, trend_y2) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, trend_y2)); 
                    })
                    .style("display", "block");

                //if color selected as gender
                if(document.getElementById("colorSelect").value == "Gender"){
                    var m_trendline = getTrendline(value, other_value, "male");
                    if(m_trendline != null){
                        var m_trend_x1 = this_xscale.domain()[0];
                        var m_trend_y1 = m_trendline[0] * (coordinates_x_scale == "log"? Math.log10(this_xscale.domain()[0]) : this_xscale.domain()[0]) + m_trendline[1];
                        var m_trend_x2 = this_xscale.domain()[1];
                        var m_trend_y2 = m_trendline[0] * (coordinates_x_scale == "log"? Math.log10(this_xscale.domain()[1]) : this_xscale.domain()[1]) + m_trendline[1];
                        p_svg.select(".m_trendline").transition().duration(500)
                            // .attr("x1", function(d) { 
                            //     return m_trend_y1 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (this_yscale.domain()[0] - m_trendline[1]) / m_trendline[0]) : (this_yscale.domain()[0] - m_trendline[1]) / m_trendline[0]) : this_xscale(m_trend_x1); 
                            // })
                            // .attr("y1", function(d) { 
                            //     return m_trend_y1 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(m_trend_y1); 
                            // })
                            // .attr("x2", function(d) { 
                            //     return m_trend_y2 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (this_yscale.domain()[0] - m_trendline[1]) / m_trendline[0]) : (this_yscale.domain()[0] - m_trendline[1]) / m_trendline[0]) : this_xscale(m_trend_x2); 
                            // })
                            // .attr("y2", function(d) { 
                            //     return m_trend_y2 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(m_trend_y2); 
                            // })
                            .attr("x1", function(d) { 
                                    if(coordinates_y_scale == "log"){
                                        return Math.pow(10, m_trend_y1) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - m_trendline[1]) / m_trendline[0]) : (Math.log10(this_yscale.domain()[0]) - m_trendline[1]) / m_trendline[0]) : this_xscale(m_trend_x1); 
                                    }
                                    else
                                        return m_trend_y1 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (this_yscale.domain()[0] - m_trendline[1]) / m_trendline[0]) : (this_yscale.domain()[0] - m_trendline[1]) / m_trendline[0]) : this_xscale(m_trend_x1); 
                                })
                                .attr("y1", function(d) { 
                                    if(coordinates_y_scale == "log"){
                                        return Math.pow(10, m_trend_y1) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, m_trend_y1)); 
                                    }
                                    else
                                        return m_trend_y1 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(m_trend_y1); 
                                })
                                .attr("x2", function(d) { 
                                    if(coordinates_y_scale == "log"){
                                        return Math.pow(10, m_trend_y2) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - m_trendline[1]) / m_trendline[0]) : (Math.log10(this_yscale.domain()[0]) - m_trendline[1]) / m_trendline[0]) : this_xscale(m_trend_x2); 
                                    }
                                    else
                                        return m_trend_y2 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (this_yscale.domain()[0] - m_trendline[1]) / m_trendline[0]) : (this_yscale.domain()[0] - m_trendline[1]) / m_trendline[0]) : this_xscale(m_trend_x2); 
                                })
                                .attr("y2", function(d) { 
                                    if(coordinates_y_scale == "log"){
                                        return Math.pow(10, m_trend_y2) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, m_trend_y2)); 
                                    }
                                    else
                                        return m_trend_y2 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(m_trend_y2);    
                                })
                            .style("display", "block");
                    }

                    var f_trendline = getTrendline(value, other_value, "female");
                    if(f_trendline != null){
                        var f_trend_x1 = this_xscale.domain()[0];
                        var f_trend_y1 = f_trendline[0] * (coordinates_x_scale == "log"? Math.log10(this_xscale.domain()[0]) : this_xscale.domain()[0]) + f_trendline[1];
                        var f_trend_x2 = this_xscale.domain()[1];
                        var f_trend_y2 = f_trendline[0] * (coordinates_x_scale == "log"? Math.log10(this_xscale.domain()[1]) : this_xscale.domain()[1]) + f_trendline[1];
                        p_svg.select(".f_trendline").transition().duration(500)
                            // .attr("x1", function(d) { 
                            //     return f_trend_y1 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (this_yscale.domain()[0] - f_trendline[1]) / f_trendline[0]) : (this_yscale.domain()[0] - f_trendline[1]) / f_trendline[0]) : this_xscale(f_trend_x1); 
                            // })
                            // .attr("y1", function(d) { 
                            //     return f_trend_y1 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(f_trend_y1); 
                            // })
                            // .attr("x2", function(d) { 
                            //     return f_trend_y2 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (this_yscale.domain()[0] - f_trendline[1]) / f_trendline[0]) : (this_yscale.domain()[0] - f_trendline[1]) / f_trendline[0]) : this_xscale(f_trend_x2); 
                            // })
                            // .attr("y2", function(d) { 
                            //     return f_trend_y2 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(f_trend_y2); 
                            // })
                            .attr("x1", function(d) { 
                                if(coordinates_y_scale == "log"){
                                    return Math.pow(10, f_trend_y1) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - f_trendline[1]) / f_trendline[0]) : (Math.log10(this_yscale.domain()[0]) - f_trendline[1]) / f_trendline[0]) : this_xscale(f_trend_x1); 
                                }
                                else
                                    return f_trend_y1 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (this_yscale.domain()[0] - f_trendline[1]) / f_trendline[0]) : (this_yscale.domain()[0] - f_trendline[1]) / f_trendline[0]) : this_xscale(f_trend_x1); 
                            })
                            .attr("y1", function(d) { 
                                if(coordinates_y_scale == "log"){
                                    return Math.pow(10, f_trend_y1) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, f_trend_y1)); 
                                }
                                else
                                    return f_trend_y1 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(f_trend_y1); 
                            })
                            .attr("x2", function(d) { 
                                if(coordinates_y_scale == "log"){
                                    return Math.pow(10, f_trend_y2) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - f_trendline[1]) / f_trendline[0]) : (Math.log10(this_yscale.domain()[0]) - f_trendline[1]) / f_trendline[0]) : this_xscale(f_trend_x2); 
                                }
                                else
                                    return f_trend_y2 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (this_yscale.domain()[0] - f_trendline[1]) / f_trendline[0]) : (this_yscale.domain()[0] - f_trendline[1]) / f_trendline[0]) : this_xscale(f_trend_x2); 
                            })
                            .attr("y2", function(d) { 
                                if(coordinates_y_scale == "log"){
                                    return Math.pow(10, f_trend_y2) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, f_trend_y2)); 
                                }
                                else
                                    return f_trend_y2 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(f_trend_y2); 
                            })
                            .style("display", "block");
                    }
                }
            }
        }
        else{
            p_svg.select(".trendline").style("display", "none");
            p_svg.select(".m_trendline").style("display", "none");
            p_svg.select(".f_trendline").style("display", "none");
        }
    });
    d3.select("#x_scale").select("#by_log").on("click", function(){
        if(document.getElementById("xSelect").value != "Gender"){
            var value = document.getElementById("xSelect").value;
            if(value.indexOf(')') != -1){
                value = value.substring(value.indexOf(')') + 2, value.length);
            }
            coordinates_x_scale = "log";
            d3.select("#x_scale").select("#by_log").style("background-color", "rgba(184,184,184,1)");
            d3.select("#x_scale").select("#by_linear").style("background-color", "rgba(184,184,184,0)");

            switch(value){
                case 'Degree': 
                    xScale_log.domain([d3.min(p_data, function(d){ return d[value];})-10<0? 1:d3.min(p_data, function(d){ return d[value];})-10, d3.max(p_data, function(d){ return d[value];})]); 
                    var formatNumber = d3.format(",.0f");
                    xAxis = d3.svg.axis().scale(xScale_log).orient("bottom").ticks(4, function(d) { return formatNumber(d) });
                    break;
                case 'Betweenness': 
                    xScale_log.domain([(d3.min(p_data, function(d){ return d[value];})-0.1<=0 ? 0.0001:d3.min(p_data, function(d){ return d[value];}))-0.1, d3.max(p_data, function(d){ return d[value];})]); 
                    var formatNumber = d3.format(",.4f");
                    xAxis = d3.svg.axis().scale(xScale_log).orient("bottom").ticks(4, function(d) { return formatNumber(d) });
                    break;
                case 'Gender':  
                    xScale.domain(['m', 'f']); 
                    xAxis = d3.svg.axis().scale(xScale).orient("bottomfv ");
                    break;
                case 'Age':  
                    xScale_log.domain([d3.min(p_data, function(d){ return d[value];}) - 1, d3.max(p_data, function(d){ return d[value];}) + 1]); 
                    var formatNumber = d3.format(",.0f");
                    xAxis = d3.svg.axis().scale(xScale_log).orient("bottom").ticks(5, function(d) { return formatNumber(d) });
                    break;
                case 'Fairness':
                case 'Harm':
                case 'Loyalty':
                case 'Authority':
                case 'Purity':
                    xScale_log.domain([0.1, 5]); 
                    var formatNumber = d3.format(",.1f");
                    xAxis = d3.svg.axis().scale(xScale_log).orient("bottom").ticks(5, function(d) { return formatNumber(d) });
                    break; 
                default: 
                    xScale_log.domain([0.1, 100]); 
                    var formatNumber = d3.format(",.0f");
                    xAxis = d3.svg.axis().scale(xScale_log).orient("bottom").ticks(5, function(d) { return formatNumber(d) });
                    break; 
            }
            
            // var formatNumber = d3.format(",.0f");
            // xAxis = d3.svg.axis().scale(xScale_log).orient("bottom").ticks(4, function(d) { return formatNumber(d) });
            d3.select("#analysis_personality_svg_cover").select(".x.axis")
              .transition().duration(500)
              .call(xAxis);
            d3.select("#analysis_personality_svg_cover").selectAll('.dot') // move the circles
              .attr("opacity", function (d) { return isNaN(xScale_log(d[value]))? 0:1; })
              .transition().duration(500)
              .attr('cx',function (d) { return isNaN(xScale_log(d[value]))? -1000:xScale_log(d[value]); });
            d3.select("#analysis_personality_svg_cover").selectAll('.links') // move the circles
              .style("visibility", function (d) { 
                var id_pair = d3.select(this).attr("id");
                var n1 = id_pair.substring(id_pair.indexOf('link') + 4, id_pair.indexOf('_')), n2 = id_pair.substring(id_pair.indexOf('_')+1, id_pair.length);
                return isNaN(xScale_log(coordinates_data[n1][value]))||isNaN(xScale_log(coordinates_data[n2][value]))||coordinates_data[n1][value]<0||coordinates_data[n2][value]<0? "hidden":"visible"; 
            })
              .transition().duration(500)
              .attr('x1',function () { 
                var id_pair = d3.select(this).attr("id");
                var n1 = id_pair.substring(id_pair.indexOf('link') + 4, id_pair.indexOf('_')), n2 = id_pair.substring(id_pair.indexOf('_')+1, id_pair.length);
                return isNaN(xScale_log(coordinates_data[n1][value]))? -1000:xScale_log(coordinates_data[n1][value]); 
            }).attr('x2',function () { 
                var id_pair = d3.select(this).attr("id");
                var n1 = id_pair.substring(id_pair.indexOf('link') + 4, id_pair.indexOf('_')), n2 = id_pair.substring(id_pair.indexOf('_')+1, id_pair.length);
                return isNaN(xScale_log(coordinates_data[n2][value]))? -1000:xScale_log(coordinates_data[n2][value]); 
            });
            d3.select("#analysis_personality_svg_cover").selectAll('.dot_text') // move the circles
              .attr("opacity", function (d) { return isNaN(xScale_log(d[value]))? 0:1; })
              .transition().duration(500)
              .attr('x',function (d) { return (isNaN(xScale_log(d[value]))? -1000:xScale_log(d[value])) - 6; });

            if(value != "Gender"){
                var other_value = document.getElementById("ySelect").value;
                if(other_value.indexOf(')') != -1){
                    other_value = other_value.substring(other_value.indexOf(')') + 2, other_value.length);
                }
                var this_xscale = xScale_log;
                var this_yscale = update_yAxis(other_value);
                var trendline = getTrendline(value, other_value, "all");
                if(trendline != null){
                    var trend_x1 = this_xscale.domain()[0];
                    var trend_y1 = trendline[0] * (coordinates_x_scale == "log"? Math.log10(this_xscale.domain()[0]) : this_xscale.domain()[0]) + trendline[1];
                    var trend_x2 = this_xscale.domain()[1];
                    var trend_y2 = trendline[0] * (coordinates_x_scale == "log"? Math.log10(this_xscale.domain()[1]) : this_xscale.domain()[1]) + trendline[1];
                    p_svg.select(".trendline").transition().duration(500)
                        .attr("x1", function(d) { 
                            if(coordinates_y_scale == "log"){
                                return Math.pow(10, trend_y1) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - trendline[1]) / trendline[0]) : (Math.log10(this_yscale.domain()[0]) - trendline[1]) / trendline[0]) : this_xscale(trend_x1); 
                            }
                            else
                                return trend_y1 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (this_yscale.domain()[0] - trendline[1]) / trendline[0]) : (this_yscale.domain()[0] - trendline[1]) / trendline[0]) : this_xscale(trend_x1); 
                            // return Math.pow(10, trend_y1) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - trendline[1]) / trendline[0]) : (Math.log10(this_yscale.domain()[0]) - trendline[1]) / trendline[0]) : this_xscale(trend_x1); 
                        })
                        .attr("y1", function(d) { 
                            if(coordinates_y_scale == "log"){
                                return Math.pow(10, trend_y1) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, trend_y1)); 
                            }
                            else
                                return trend_y1 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(trend_y1);    
                            // return Math.pow(10, trend_y1) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, trend_y1)); 
                        })
                        .attr("x2", function(d) { 
                            if(coordinates_y_scale == "log"){
                                return Math.pow(10, trend_y2) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - trendline[1]) / trendline[0]) : (Math.log10(this_yscale.domain()[0]) - trendline[1]) / trendline[0]) : this_xscale(trend_x2); 
                            }
                            else
                                return trend_y2 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (this_yscale.domain()[0] - trendline[1]) / trendline[0]) : (this_yscale.domain()[0] - trendline[1]) / trendline[0]) : this_xscale(trend_x2); 
                            // return Math.pow(10, trend_y2) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - trendline[1]) / trendline[0]) : (Math.log10(this_yscale.domain()[0]) - trendline[1]) / trendline[0]) : this_xscale(trend_x2); 
                        })
                        .attr("y2", function(d) { 
                            if(coordinates_y_scale == "log"){
                                return Math.pow(10, trend_y2) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, trend_y2)); 
                            }
                            else
                                return trend_y2 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(trend_y2); 
                            // return Math.pow(10, trend_y2) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, trend_y2)); 
                        })
                        .style("display", "block");

                    //if color selected as gender
                    if(document.getElementById("colorSelect").value == "Gender"){
                        var m_trendline = getTrendline(value, other_value, "male");
                        if(m_trendline != null){
                            var m_trend_x1 = this_xscale.domain()[0];
                            var m_trend_y1 = m_trendline[0] * (coordinates_x_scale == "log"? Math.log10(this_xscale.domain()[0]) : this_xscale.domain()[0]) + m_trendline[1];
                            var m_trend_x2 = this_xscale.domain()[1];
                            var m_trend_y2 = m_trendline[0] * (coordinates_x_scale == "log"? Math.log10(this_xscale.domain()[1]) : this_xscale.domain()[1]) + m_trendline[1];
                            p_svg.select(".m_trendline").transition().duration(500)
                                // .attr("x1", function(d) { 
                                //     return Math.pow(10, m_trend_y1) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - m_trendline[1]) / m_trendline[0]) : (Math.log10(this_yscale.domain()[0]) - m_trendline[1]) / m_trendline[0]) : this_xscale(m_trend_x1); 
                                // })
                                // .attr("y1", function(d) { 
                                //     return Math.pow(10, m_trend_y1) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, m_trend_y1)); 
                                // })
                                // .attr("x2", function(d) { 
                                //     return Math.pow(10, m_trend_y2) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - m_trendline[1]) / m_trendline[0]) : (Math.log10(this_yscale.domain()[0]) - m_trendline[1]) / m_trendline[0]) : this_xscale(m_trend_x2); 
                                // })
                                // .attr("y2", function(d) { 
                                //     return Math.pow(10, m_trend_y2) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, m_trend_y2)); 
                                // })
                                .attr("x1", function(d) { 
                                    if(coordinates_y_scale == "log"){
                                        return Math.pow(10, m_trend_y1) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - m_trendline[1]) / m_trendline[0]) : (Math.log10(this_yscale.domain()[0]) - m_trendline[1]) / m_trendline[0]) : this_xscale(m_trend_x1); 
                                    }
                                    else
                                        return m_trend_y1 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (this_yscale.domain()[0] - m_trendline[1]) / m_trendline[0]) : (this_yscale.domain()[0] - m_trendline[1]) / m_trendline[0]) : this_xscale(m_trend_x1); 
                                })
                                .attr("y1", function(d) { 
                                    if(coordinates_y_scale == "log"){
                                        return Math.pow(10, m_trend_y1) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, m_trend_y1)); 
                                    }
                                    else
                                        return m_trend_y1 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(m_trend_y1); 
                                })
                                .attr("x2", function(d) { 
                                    if(coordinates_y_scale == "log"){
                                        return Math.pow(10, m_trend_y2) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - m_trendline[1]) / m_trendline[0]) : (Math.log10(this_yscale.domain()[0]) - m_trendline[1]) / m_trendline[0]) : this_xscale(m_trend_x2); 
                                    }
                                    else
                                        return m_trend_y2 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (this_yscale.domain()[0] - m_trendline[1]) / m_trendline[0]) : (this_yscale.domain()[0] - m_trendline[1]) / m_trendline[0]) : this_xscale(m_trend_x2); 
                                })
                                .attr("y2", function(d) { 
                                    if(coordinates_y_scale == "log"){
                                        return Math.pow(10, m_trend_y2) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, m_trend_y2)); 
                                    }
                                    else
                                        return m_trend_y2 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(m_trend_y2);    
                                })
                                .style("display", "block");
                        }

                        var f_trendline = getTrendline(value, other_value, "female");
                        if(f_trendline != null){
                            var f_trend_x1 = this_xscale.domain()[0];
                            var f_trend_y1 = f_trendline[0] * (coordinates_x_scale == "log"? Math.log10(this_xscale.domain()[0]) : this_xscale.domain()[0]) + f_trendline[1];
                            var f_trend_x2 = this_xscale.domain()[1];
                            var f_trend_y2 = f_trendline[0] * (coordinates_x_scale == "log"? Math.log10(this_xscale.domain()[1]) : this_xscale.domain()[1]) + f_trendline[1];
                            p_svg.select(".f_trendline").transition().duration(500)
                                // .attr("x1", function(d) { 
                                //     return Math.pow(10, f_trend_y1) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - f_trendline[1]) / f_trendline[0]) : (Math.log10(this_yscale.domain()[0]) - f_trendline[1]) / f_trendline[0]) : this_xscale(f_trend_x1); 
                                // })
                                // .attr("y1", function(d) { 
                                //     return Math.pow(10, f_trend_y1) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, f_trend_y1)); 
                                // })
                                // .attr("x2", function(d) { 
                                //     return Math.pow(10, f_trend_y2) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - f_trendline[1]) / f_trendline[0]) : (Math.log10(this_yscale.domain()[0]) - f_trendline[1]) / f_trendline[0]) : this_xscale(f_trend_x2); 
                                // })
                                // .attr("y2", function(d) { 
                                //     return Math.pow(10, f_trend_y2) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, f_trend_y2)); 
                                // })
                                .attr("x1", function(d) { 
                                    if(coordinates_y_scale == "log"){
                                        return Math.pow(10, f_trend_y1) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - f_trendline[1]) / f_trendline[0]) : (Math.log10(this_yscale.domain()[0]) - f_trendline[1]) / f_trendline[0]) : this_xscale(f_trend_x1); 
                                    }
                                    else
                                        return f_trend_y1 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (this_yscale.domain()[0] - f_trendline[1]) / f_trendline[0]) : (this_yscale.domain()[0] - f_trendline[1]) / f_trendline[0]) : this_xscale(f_trend_x1); 
                                })
                                .attr("y1", function(d) { 
                                    if(coordinates_y_scale == "log"){
                                        return Math.pow(10, f_trend_y1) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, f_trend_y1)); 
                                    }
                                    else
                                        return f_trend_y1 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(f_trend_y1); 
                                })
                                .attr("x2", function(d) { 
                                    if(coordinates_y_scale == "log"){
                                        return Math.pow(10, f_trend_y2) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - f_trendline[1]) / f_trendline[0]) : (Math.log10(this_yscale.domain()[0]) - f_trendline[1]) / f_trendline[0]) : this_xscale(f_trend_x2); 
                                    }
                                    else
                                        return f_trend_y2 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (this_yscale.domain()[0] - f_trendline[1]) / f_trendline[0]) : (this_yscale.domain()[0] - f_trendline[1]) / f_trendline[0]) : this_xscale(f_trend_x2); 
                                })
                                .attr("y2", function(d) { 
                                    if(coordinates_y_scale == "log"){
                                        return Math.pow(10, f_trend_y2) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, f_trend_y2)); 
                                    }
                                    else
                                        return f_trend_y2 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(f_trend_y2); 
                                })
                                .style("display", "block");
                        }
                    }
                }
            }
            else{
                p_svg.select(".trendline").style("display", "none");
                p_svg.select(".m_trendline").style("display", "none");
                p_svg.select(".f_trendline").style("display", "none");
            }
        }
    });
    d3.select("#y_scale").select("#by_linear").on("click", function(){
        coordinates_y_scale = "linear";
        var value = document.getElementById("ySelect").value;
        if(value.indexOf(')') != -1){
            value = value.substring(value.indexOf(')') + 2, value.length);
        }
        d3.select("#y_scale").select("#by_log").style("background-color", "rgba(184,184,184,0)");
        d3.select("#y_scale").select("#by_linear").style("background-color", "rgba(184,184,184,1)");

        switch(value){
            case 'Degree': 
                yScale = d3.scale.linear().range([p_height, 0]).nice();
                yScale.domain([d3.min(p_data, function(d){ return d[value];})-10<0? 0:d3.min(p_data, function(d){ return d[value];})-10, d3.max(p_data, function(d){ return d[value];})]); 
                var formatNumber = d3.format(",.0f");
                yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(4, function(d) { return formatNumber(d) });
                break;
            case 'Betweenness': 
                yScale = d3.scale.linear().range([p_height, 0]).nice();
                yScale.domain([(d3.min(p_data, function(d){ return d[value];})-0.1< 0 ? 0 : d3.min(p_data, function(d){ return d[value];}))-0.1, d3.max(p_data, function(d){ return d[value];})]); 
                var formatNumber = d3.format(",.4f");
                yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(4, function(d) { return formatNumber(d) });
                break;
            case 'Gender':  
                yScale = d3.scale.ordinal().range([p_height, 0]).nice();
                yScale.domain(['m', 'f']); 
                yAxis = d3.svg.axis().scale(yScale).orient("left");
                break;
            case 'Age':  
                yScale = d3.scale.linear().range([p_height, 0]);
                yScale.domain([d3.min(p_data, function(d){ return d[value];}) - 1, d3.max(p_data, function(d){ return d[value];}) + 1]); 
                var formatNumber = d3.format(",.0f");
                yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(5, function(d) { return formatNumber(d) });
                break;
            case 'Fairness':
            case 'Harm':
            case 'Loyalty':
            case 'Authority':
            case 'Purity':
                yScale = d3.scale.linear().range([p_height, 0]).nice();
                yScale.domain([0, 5]); 
                var formatNumber = d3.format(",.1f");
                yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(5, function(d) { return formatNumber(d) });
                break; 
            default: 
                yScale = d3.scale.linear().range([p_height, 0]).nice();
                yScale.domain([0, 100]); 
                var formatNumber = d3.format(",.0f");
                yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(5, function(d) { return formatNumber(d) });
        }

        // yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(4);
        d3.select("#analysis_personality_svg_cover").select(".y.axis")
          .transition().duration(500)
          .call(yAxis);
        d3.select("#analysis_personality_svg_cover").selectAll('.dot') // move the circles
          .attr("opacity", function (d) { return isNaN(yScale(d[value]))? 0:1; })
          .transition().duration(500)
          .attr('cy',function (d) { return isNaN(yScale(d[value]))? -1000:yScale(d[value]); });
        d3.select("#analysis_personality_svg_cover").selectAll('.links') // move the circles
          .style("visibility", function (d) { 
            var id_pair = d3.select(this).attr("id");
            var n1 = id_pair.substring(id_pair.indexOf('link') + 4, id_pair.indexOf('_')), n2 = id_pair.substring(id_pair.indexOf('_')+1, id_pair.length);
            return isNaN(yScale(coordinates_data[n1][value]))||isNaN(yScale(coordinates_data[n2][value]))||coordinates_data[n1][value]<0||coordinates_data[n2][value]<0? "hidden":"visible"; 
          })
          .transition().duration(500)
          .attr('y1',function () { 
            var id_pair = d3.select(this).attr("id");
            var n1 = id_pair.substring(id_pair.indexOf('link') + 4, id_pair.indexOf('_')), n2 = id_pair.substring(id_pair.indexOf('_')+1, id_pair.length);
            return isNaN(yScale(coordinates_data[n1][value]))? -1000:yScale(coordinates_data[n1][value]); 
        }).attr('y2',function () { 
            var id_pair = d3.select(this).attr("id");
            var n1 = id_pair.substring(id_pair.indexOf('link') + 4, id_pair.indexOf('_')), n2 = id_pair.substring(id_pair.indexOf('_')+1, id_pair.length);
            return isNaN(yScale(coordinates_data[n2][value]))? -1000:yScale(coordinates_data[n2][value]); 
        });
        d3.select("#analysis_personality_svg_cover").selectAll('.dot_text') // move the circles
          .attr("opacity", function (d) { return isNaN(yScale(d[value]))? 0:1; })
          .transition().duration(500)
          .attr('y',function (d) { 
              var other_value2 = document.getElementById("sizeSelect").value;
              if(other_value2.indexOf(')') != -1){
                  other_value2 = other_value2.substring(other_value2.indexOf(')') + 2, other_value2.length);
              }
              switch(other_value2){
                  case "Degree":
                  case "Betweenness":
                      return (isNaN(yScale(d[value]))? -1000:yScale(d[value])) - (d[other_value2] * 12 + 4) - 4;
                      break;
                  default:
                      return (isNaN(yScale(d[value]))? -1000:yScale(d[value])) - (d[other_value2] / 100 * 12 + 4) - 4;
                      break;
              }
          });

        if(value != "Gender"){
            var other_value = document.getElementById("xSelect").value;
            if(other_value.indexOf(')') != -1){
                other_value = other_value.substring(other_value.indexOf(')') + 2, other_value.length);
            }
            var this_yscale = yScale;
            var this_xscale = update_xAxis(other_value);
            var trendline = getTrendline(other_value, value, "all");
            if(trendline != null){
                var trend_x1 = this_xscale.domain()[0];
                var trend_y1 = trendline[0] * (coordinates_x_scale == "log" ? Math.log10(this_xscale.domain()[0]) : this_xscale.domain()[0]) + trendline[1];
                var trend_x2 = this_xscale.domain()[1];
                var trend_y2 = trendline[0] * (coordinates_x_scale == "log" ? Math.log10(this_xscale.domain()[1]) : this_xscale.domain()[1]) + trendline[1];
                p_svg.select(".trendline").transition().duration(500)
                    .attr("x1", function(d) { 
                        return trend_y1 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (this_yscale.domain()[0] - trendline[1]) / trendline[0]) : (this_yscale.domain()[0] - trendline[1]) / trendline[0]) : this_xscale(trend_x1); 
                    })
                    .attr("y1", function(d) { 
                        return trend_y1 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(trend_y1); 
                    })
                    .attr("x2", function(d) { 
                        return trend_y2 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (this_yscale.domain()[0] - trendline[1]) / trendline[0]) : (this_yscale.domain()[0] - trendline[1]) / trendline[0]) : this_xscale(trend_x2); 

                    })
                    .attr("y2", function(d) { 
                        return trend_y2 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(trend_y2); 
                    })
                    .style("display", "block");

                //if color selected as gender, draw two trendlines for male and ffemale
                if(document.getElementById("colorSelect").value == "Gender"){
                    var m_trendline = getTrendline(other_value, value, "male");
                    if(m_trendline != null){
                        var m_trend_x1 = this_xscale.domain()[0];
                        var m_trend_y1 = m_trendline[0] * (coordinates_x_scale == "log"? Math.log10(this_xscale.domain()[0]) : this_xscale.domain()[0]) + m_trendline[1];
                        var m_trend_x2 = this_xscale.domain()[1];
                        var m_trend_y2 = m_trendline[0] * (coordinates_x_scale == "log"? Math.log10(this_xscale.domain()[1]) : this_xscale.domain()[1]) + m_trendline[1];
                        p_svg.select(".m_trendline").transition().duration(500)
                            .attr("x1", function(d) { 
                                return m_trend_y1 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (this_yscale.domain()[0] - m_trendline[1]) / m_trendline[0]) : (this_yscale.domain()[0] - m_trendline[1]) / m_trendline[0]) : this_xscale(m_trend_x1); 
                            })
                            .attr("y1", function(d) { 
                                return m_trend_y1 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(m_trend_y1); 
                            })
                            .attr("x2", function(d) { 
                                return m_trend_y2 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (this_yscale.domain()[0] - m_trendline[1]) / m_trendline[0]) : (this_yscale.domain()[0] - m_trendline[1]) / m_trendline[0]) : this_xscale(m_trend_x2); 
                            })
                            .attr("y2", function(d) { 
                                return m_trend_y2 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(m_trend_y2);    
                            })
                            .style("display", "block");
                    }

                    var f_trendline = getTrendline(other_value, value, "female");
                    if(f_trendline != null){
                        var f_trend_x1 = this_xscale.domain()[0];
                        var f_trend_y1 = f_trendline[0] * (coordinates_x_scale == "log"? Math.log10(this_xscale.domain()[0]) : this_xscale.domain()[0]) + f_trendline[1];
                        var f_trend_x2 = this_xscale.domain()[1];
                        var f_trend_y2 = f_trendline[0] * (coordinates_x_scale == "log"? Math.log10(this_xscale.domain()[1]) : this_xscale.domain()[1]) + f_trendline[1];
                        p_svg.select(".f_trendline").transition().duration(500)
                            .attr("x1", function(d) { 
                                return f_trend_y1 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (this_yscale.domain()[0] - f_trendline[1]) / f_trendline[0]) : (this_yscale.domain()[0] - f_trendline[1]) / f_trendline[0]) : this_xscale(f_trend_x1); 
                            })
                            .attr("y1", function(d) { 
                                return f_trend_y1 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(f_trend_y1); 
                            })
                            .attr("x2", function(d) { 
                                return f_trend_y2 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (this_yscale.domain()[0] - f_trendline[1]) / f_trendline[0]) : (this_yscale.domain()[0] - f_trendline[1]) / f_trendline[0]) : this_xscale(f_trend_x2); 
                            })
                            .attr("y2", function(d) { 
                                return f_trend_y2 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(f_trend_y2); 
                            })
                            .style("display", "block");
                    }
                }
            }
        }
        else{
            p_svg.select(".trendline").style("display", "none");
            p_svg.select(".m_trendline").style("display", "none");
            p_svg.select(".f_trendline").style("display", "none");
        }
        
    });
    d3.select("#y_scale").select("#by_log").on("click", function(){
        if(document.getElementById("ySelect").value != "Gender"){
            var value = document.getElementById("ySelect").value;
            if(value.indexOf(')') != -1){
                value = value.substring(value.indexOf(')') + 2, value.length);
            }
            coordinates_y_scale = "log";
            d3.select("#y_scale").select("#by_log").style("background-color", "rgba(184,184,184,1)");
            d3.select("#y_scale").select("#by_linear").style("background-color", "rgba(184,184,184,0)");

            switch(value){
                case 'Degree': 
                    yScale_log = d3.scale.log().base(10).range([p_height, 0]).nice();
                    yScale_log.domain([d3.min(p_data, function(d){ return d[value];})-10<0? 1:d3.min(p_data, function(d){ return d[value];})-10, d3.max(p_data, function(d){ return d[value];})]); 
                    var formatNumber = d3.format(",.0f");
                    yAxis = d3.svg.axis().scale(yScale_log).orient("left").ticks(4, function(d) { return formatNumber(d) });
                    break;
                case 'Betweenness': 
                    yScale_log = d3.scale.log().base(10).range([p_height, 0]).nice();
                    yScale_log.domain([(d3.min(p_data, function(d){ return d[value];})-0.1<=0 ? 0.0001 : d3.min(p_data, function(d){ return d[value];}))-0.1, d3.max(p_data, function(d){ return d[value];})]); 
                    var formatNumber = d3.format(",.4f");
                    yAxis = d3.svg.axis().scale(yScale_log).orient("left").ticks(4, function(d) { return formatNumber(d) });
                    break;
                case 'Gender':  
                    yScale = d3.scale.ordinal().range([p_height, 0]).nice();
                    yScale.domain(['m', 'f']); 
                    yAxis = d3.svg.axis().scale(yScale).orient("left");
                    break;
                case 'Age':  
                    yScale_log = d3.scale.log().base(10).range([p_height, 0]);
                    yScale_log.domain([d3.min(p_data, function(d){ return d[value];}) - 1, d3.max(p_data, function(d){ return d[value];}) + 1]); 
                    var formatNumber = d3.format(",.0f");
                    yAxis = d3.svg.axis().scale(yScale_log).orient("left").ticks(5, function(d) { return formatNumber(d) });
                    break;
                case 'Fairness':
                case 'Harm':
                case 'Loyalty':
                case 'Authority':
                case 'Purity':
                    yScale_log = d3.scale.log().base(10).range([p_height, 0]).nice();
                    yScale_log.domain([0.1, 5]); 
                    var formatNumber = d3.format(",.1f");
                    yAxis = d3.svg.axis().scale(yScale_log).orient("left").ticks(5, function(d) { return formatNumber(d) });
                    break; 
                default: 
                    yScale_log = d3.scale.log().base(10).range([p_height, 0]).nice();
                    yScale_log.domain([0.1, 100]); 
                    var formatNumber = d3.format(",.0f");
                    yAxis = d3.svg.axis().scale(yScale_log).orient("left").ticks(5, function(d) { return formatNumber(d) });
            }

            // var formatNumber = d3.format(",.0f");
            // yAxis = d3.svg.axis().scale(yScale_log).orient("left").ticks(4, function(d) { return formatNumber(d) });
            d3.select("#analysis_personality_svg_cover").select(".y.axis")
              .transition().duration(500)
              .call(yAxis);
            d3.select("#analysis_personality_svg_cover").selectAll('.dot') // move the circles
              .attr("opacity", function (d) { return isNaN(yScale_log(d[value]))? 0:1; })
              .transition().duration(500)
              .attr('cy',function (d) { return isNaN(yScale_log(d[value]))? -1000:yScale_log(d[value]); });
            d3.select("#analysis_personality_svg_cover").selectAll('.links') // move the circles
              .style("visibility", function (d) { 
                var id_pair = d3.select(this).attr("id");
                var n1 = id_pair.substring(id_pair.indexOf('link') + 4, id_pair.indexOf('_')), n2 = id_pair.substring(id_pair.indexOf('_')+1, id_pair.length);
                return isNaN(yScale_log(coordinates_data[n1][value]))||isNaN(yScale_log(coordinates_data[n2][value]))||coordinates_data[n1][value]<0||coordinates_data[n2][value]<0? "hidden":"visible"; 
              })
              .transition().duration(500)
              .attr('y1',function () { 
                var id_pair = d3.select(this).attr("id");
                var n1 = id_pair.substring(id_pair.indexOf('link') + 4, id_pair.indexOf('_')), n2 = id_pair.substring(id_pair.indexOf('_')+1, id_pair.length);
                return isNaN(yScale_log(coordinates_data[n1][value]))? -1000:yScale_log(coordinates_data[n1][value]); 
            }).attr('y2',function () { 
                var id_pair = d3.select(this).attr("id");
                var n1 = id_pair.substring(id_pair.indexOf('link') + 4, id_pair.indexOf('_')), n2 = id_pair.substring(id_pair.indexOf('_')+1, id_pair.length);
                return isNaN(yScale_log(coordinates_data[n2][value]))? -1000:yScale_log(coordinates_data[n2][value]); 
            });
            d3.select("#analysis_personality_svg_cover").selectAll('.dot_text') // move the circles
              .attr("opacity", function (d) { return isNaN(yScale_log(d[value]))? 0:1; })
              .transition().duration(500)
              .attr('y',function (d) { 
                  var other_value2 = document.getElementById("sizeSelect").value;
                  if(other_value2.indexOf(')') != -1){
                      other_value2 = other_value2.substring(other_value2.indexOf(')') + 2, other_value2.length);
                  }
                  switch(other_value2){
                      case "Degree":
                      case "Betweenness":
                          return (isNaN(yScale_log(d[value]))? -1000:yScale_log(d[value])) - (d[other_value2] * 12 + 4) - 4;
                          break;
                      default:
                          return (isNaN(yScale_log(d[value]))? -1000:yScale_log(d[value])) - (d[other_value2] / 100 * 12 + 4) - 4;
                          break;
                  }
              });

            if(value != "Gender"){
                var other_value = document.getElementById("xSelect").value;
                if(other_value.indexOf(')') != -1){
                    other_value = other_value.substring(other_value.indexOf(')') + 2, other_value.length);
                }
                var this_yscale = yScale_log;
                var this_xscale = update_xAxis(other_value);
                var trendline = getTrendline(other_value, value, "all");
                if(trendline != null){
                    var trend_x1 = this_xscale.domain()[0];
                    var trend_y1 = trendline[0] * (coordinates_x_scale == "log" ? Math.log10(this_xscale.domain()[0]) : this_xscale.domain()[0]) + trendline[1];
                    var trend_x2 = this_xscale.domain()[1];
                    var trend_y2 = trendline[0] * (coordinates_x_scale == "log" ? Math.log10(this_xscale.domain()[1]) : this_xscale.domain()[1]) + trendline[1];
                    p_svg.select(".trendline").transition().duration(500)
                        .attr("x1", function(d) { 
                            return Math.pow(10, trend_y1) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - trendline[1]) / trendline[0]) : (Math.log10(this_yscale.domain()[0]) - trendline[1]) / trendline[0]) : this_xscale(trend_x1); 
                        })
                        .attr("y1", function(d) { 
                            return Math.pow(10, trend_y1) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, trend_y1)); 
                        })
                        .attr("x2", function(d) { 
                            return Math.pow(10, trend_y2) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - trendline[1]) / trendline[0]) : (Math.log10(this_yscale.domain()[0]) - trendline[1]) / trendline[0]) : this_xscale(trend_x2); 
                        })
                        .attr("y2", function(d) { 
                            return Math.pow(10, trend_y2) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, trend_y2)); 
                        })
                        .style("display", "block");

                    //if color selected as gender, draw two trendlines for male and ffemale
                    if(document.getElementById("colorSelect").value == "Gender"){
                        var m_trendline = getTrendline(other_value, value, "male");
                        if(m_trendline != null){
                            var m_trend_x1 = this_xscale.domain()[0];
                            var m_trend_y1 = m_trendline[0] * (coordinates_x_scale == "log"? Math.log10(this_xscale.domain()[0]) : this_xscale.domain()[0]) + m_trendline[1];
                            var m_trend_x2 = this_xscale.domain()[1];
                            var m_trend_y2 = m_trendline[0] * (coordinates_x_scale == "log"? Math.log10(this_xscale.domain()[1]) : this_xscale.domain()[1]) + m_trendline[1];
                            p_svg.select(".m_trendline").transition().duration(500)
                                .attr("x1", function(d) { 
                                    return Math.pow(10, m_trend_y1) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - m_trendline[1]) / m_trendline[0]) : (Math.log10(this_yscale.domain()[0]) - m_trendline[1]) / m_trendline[0]) : this_xscale(m_trend_x1); 
                                })
                                .attr("y1", function(d) { 
                                    return Math.pow(10, m_trend_y1) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, m_trend_y1)); 
                                })
                                .attr("x2", function(d) { 
                                    return Math.pow(10, m_trend_y2) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - m_trendline[1]) / m_trendline[0]) : (Math.log10(this_yscale.domain()[0]) - m_trendline[1]) / m_trendline[0]) : this_xscale(m_trend_x2); 
                                })
                                .attr("y2", function(d) { 
                                    return Math.pow(10, m_trend_y2) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, m_trend_y2)); 
                                })
                                .style("display", "block");
                        }

                        var f_trendline = getTrendline(other_value, value, "female");
                        if(f_trendline != null){
                            var f_trend_x1 = this_xscale.domain()[0];
                            var f_trend_y1 = f_trendline[0] * (coordinates_x_scale == "log"? Math.log10(this_xscale.domain()[0]) : this_xscale.domain()[0]) + f_trendline[1];
                            var f_trend_x2 = this_xscale.domain()[1];
                            var f_trend_y2 = f_trendline[0] * (coordinates_x_scale == "log"? Math.log10(this_xscale.domain()[1]) : this_xscale.domain()[1]) + f_trendline[1];
                            p_svg.select(".f_trendline").transition().duration(500)
                                .attr("x1", function(d) { 
                                    return Math.pow(10, f_trend_y1) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - f_trendline[1]) / f_trendline[0]) : (Math.log10(this_yscale.domain()[0]) - f_trendline[1]) / f_trendline[0]) : this_xscale(f_trend_x1); 
                                })
                                .attr("y1", function(d) { 
                                    return Math.pow(10, f_trend_y1) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, f_trend_y1)); 
                                })
                                .attr("x2", function(d) { 
                                    return Math.pow(10, f_trend_y2) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - f_trendline[1]) / f_trendline[0]) : (Math.log10(this_yscale.domain()[0]) - f_trendline[1]) / f_trendline[0]) : this_xscale(f_trend_x2); 
                                })
                                .attr("y2", function(d) { 
                                    return Math.pow(10, f_trend_y2) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, f_trend_y2)); 
                                })
                                .style("display", "block");
                        }
                    }
                }
            }
            else{
                p_svg.select(".trendline").style("display", "none");
                p_svg.select(".m_trendline").style("display", "none");
                p_svg.select(".f_trendline").style("display", "none");
            }
        }
    });
    
    var trendline = getTrendline('Open-Mindedness', 'Conscientiousness', 'all');
    if(trendline != null){
        var trend_x1 = xScale.domain()[0];
        var trend_y1 = trendline[0] * trend_x1 + trendline[1];
        var trend_x2 = xScale.domain()[1];
        var trend_y2 = trendline[0] * trend_x2 + trendline[1];
        p_svg.append("line").attr("class", "trendline")
            .attr("x1", function(d) { return trend_y1 < yScale.domain()[0] ? xScale((yScale.domain()[0] - trendline[1]) / trendline[0]) : xScale(trend_x1); })
            .attr("y1", function(d) { return trend_y1 < yScale.domain()[0] ? yScale(yScale.domain()[0]) : yScale(trend_y1); })
            .attr("x2", function(d) { return trend_y2 < yScale.domain()[0] ? xScale((yScale.domain()[0] - trendline[1]) / trendline[0]) : xScale(trend_x2); })
            .attr("y2", function(d) { return trend_y2 < yScale.domain()[0] ? yScale(yScale.domain()[0]) : yScale(trend_y2); })
            .attr("stroke", "#aaa")
            .attr("stroke-width", 1.5);
        
        var m_trendline = getTrendline('Open-Mindedness', 'Conscientiousness', "male");
        if(m_trendline != null){
            var m_trend_x1 = xScale.domain()[0];
            var m_trend_y1 = m_trendline[0] * m_trend_x1 + m_trendline[1];
            var m_trend_x2 = xScale.domain()[1];
            var m_trend_y2 = m_trendline[0] * m_trend_x2 + m_trendline[1];
            p_svg.append("line").attr("class", "m_trendline")
                .attr("x1", function(d) { return m_trend_y1 < yScale.domain()[0] ? xScale((yScale.domain()[0] - m_trendline[1]) / m_trendline[0]) : xScale(m_trend_x1); })
                .attr("y1", function(d) { return m_trend_y1 < yScale.domain()[0] ? yScale(yScale.domain()[0]) : yScale(m_trend_y1); })
                .attr("x2", function(d) { return m_trend_y2 < yScale.domain()[0] ? xScale((yScale.domain()[0] - m_trendline[1]) / m_trendline[0]) : xScale(m_trend_x2); })
                .attr("y2", function(d) { return m_trend_y2 < yScale.domain()[0] ? yScale(yScale.domain()[0]) : yScale(m_trend_y2); })
                .attr("stroke", "#7fbfe2")
                .attr("stroke-width", 0.5)
                .style("opacity", 0.8);
        }

        var f_trendline = getTrendline('Open-Mindedness', 'Conscientiousness', "female");
        if(f_trendline != null){
            var f_trend_x1 = xScale.domain()[0];
            var f_trend_y1 = f_trendline[0] * f_trend_x1 + f_trendline[1];
            var f_trend_x2 = xScale.domain()[1];
            var f_trend_y2 = f_trendline[0] * f_trend_x2 + f_trendline[1];
            p_svg.append("line").attr("class", "f_trendline")
                .attr("x1", function(d) { return f_trend_y1 < yScale.domain()[0] ? xScale((yScale.domain()[0] - f_trendline[1]) / f_trendline[0]) : xScale(f_trend_x1); })
                .attr("y1", function(d) { return f_trend_y1 < yScale.domain()[0] ? yScale(yScale.domain()[0]) : yScale(f_trend_y1); })
                .attr("x2", function(d) { return f_trend_y2 < yScale.domain()[0] ? xScale((yScale.domain()[0] - f_trendline[1]) / f_trendline[0]) : xScale(f_trend_x2); })
                .attr("y2", function(d) { return f_trend_y2 < yScale.domain()[0] ? yScale(yScale.domain()[0]) : yScale(f_trend_y2); })
                .attr("stroke", "#db7a7a")
                .attr("stroke-width", 0.5)
                .style("opacity", 0.8);
        }
    }

    p_svg.append("g") //x-axis 
        .attr("class", "x axis")
        .attr("transform", "translate(0," + p_height + ")")
        .call(xAxis)
      .append("text")
        .attr("class", "x_label")
        .attr("x", p_width / 2)
        .attr("y", 45)
        .style("text-anchor", "middle")
        .text("Open-Mindedness");
    p_svg.append("g") //y-axis
        .attr("class", "y axis")
        //.attr("transform", "translate(" + p_width/2 + ", 0)")
        .call(yAxis)
      .append("text")
        .attr("class", "y_label")
        .attr("transform", "rotate(-90)")
        .attr("y", -55)
        .attr("x", -p_height / 2)
        .attr("dy", ".71em")
        .style("text-anchor", "middle")
        .text("Conscientiousness");
    p_svg.selectAll(".dot")
        .data(p_data)
      .enter().append("circle")
        .attr("class", "dot")
        .attr("r", function(d){
            return (d['Agreeableness'] < 0 ? 0 : d['Agreeableness']) / 100 * 12 + 4;
        })
        .attr("cx", xMap)
        .attr("cy", yMap)
        .style("opacity", function(d){
            return 1;
            // return d['Extraversion']/100;
        })
        .style("fill", function(d) { 
            return (d['Gender'] == "m"? colors[0]:colors[3]);
            // return colors[2];
        })
        .on("mouseover", function(d, i){
            var p_svg = d3.select("#analysis_personality_svg").select("g");
            for(var kk = 0; kk < indexToNeighbors[i].length; kk++){
                var n1, n2;
                if(i < parseInt(indexToNeighbors[i][kk])){
                    n1 = d; n2 = p_data[indexToNeighbors[i][kk]];
                }
                else{
                    n2 = d; n1 = p_data[indexToNeighbors[i][kk]];
                } 
                var id_pair = parseInt(i) < parseInt(indexToNeighbors[i][kk]) ? (i+"_"+indexToNeighbors[i][kk]):(indexToNeighbors[i][kk]+"_"+i);
                p_svg.select("#link" + id_pair).style("opacity", 0.8);
            }
        })
        .on("mouseout", function(d, i){
            var p_svg = d3.select("#analysis_personality_svg").select("g");
            p_svg.selectAll(".links").style("opacity", 0);
        });

    p_svg.selectAll(".dot_text")
        .data(p_data)
      .enter().append("text")
        .attr("class", "dot_text")
        .attr("x", function(d){ return xScale(xValue(d)) - 6; })
        .attr("y", function(d){ return yScale(yValue(d)) - (d['Agreeableness'] / 100 * 12 + 4) - 4; })
        .text(function(d, i){ return (demo == 1? demo_people_names_match[usersinfo[i]['name']]:usersinfo[i].given_name);})
        .style("fill", function(d) { return "#ffffff";});


    var selectData = [ { "text" : "(P) Open-Mindedness" },
        { "text" : "(P) Conscientiousness" },
        { "text" : "(P) Extraversion" },
        { "text" : "(P) Agreeableness"},
        { "text" : "(P) Negative Emotionality"},
        { "text" : "(M) Fairness" },
        { "text" : "(M) Harm" },
        { "text" : "(M) Loyalty" },
        { "text" : "(M) Authority"},
        { "text" : "(M) Purity"},
        { "text" : "Degree"},
        { "text" : "Betweenness"},
        { "text" : "Age"},
        { "text" : "Gender"}
    ];
    var selectData2 = [ { "text" : "(P) Open-Mindedness" },
        { "text" : "(P) Conscientiousness" },
        { "text" : "(P) Extraversion" },
        { "text" : "(P) Agreeableness"},
        { "text" : "(P) Negative Emotionality"},
        { "text" : "(M) Fairness" },
        { "text" : "(M) Harm" },
        { "text" : "(M) Loyalty" },
        { "text" : "(M) Authority"},
        { "text" : "(M) Purity"},
        { "text" : "Degree"},
        { "text" : "Betweenness"},
        { "text" : "Age"}
    ];
    var xInput = d3.select("#xSelect").on('change',xChange)
    .selectAll('option')
      .data(selectData2)
      .enter()
    .append('option')
      .attr('value', function (d) { return d.text; })
      .text(function (d) { return d.text ;});
    var yInput = d3.select("#ySelect").on('change',yChange)
    .selectAll('option')
      .data(selectData2)
      .enter()
    .append('option')
      .attr('value', function (d) { return d.text; })
      .text(function (d) { return d.text ;});
      
    var colorInput = d3.select("#colorSelect").on('change',colorChange)
    .selectAll('option')
      .data(selectData)
      .enter()
    .append('option')
      .attr('value', function (d) { return d.text; })
      .text(function (d) { return d.text ;});
    var sizeInput = d3.select("#sizeSelect").on('change',sizeChange)
    .selectAll('option')
      .data(selectData2)
      .enter()
    .append('option')
      .attr('value', function (d) { return d.text; })
      .text(function (d) { return d.text ;});
    d3.select("#context_for_x").html('<b>Open-Mindedness:</b> appreciation for art, emotion, adventure, unusual ideas, curiosity, and variety of experience.');
    d3.select("#context_for_y").html('<b>Conscientiousness:</b> a tendency to be organized and dependable, show self-discipline, act dutifully, aim for achievement, and prefer planned rather than spontaneous behavior.');
    d3.select("#context_for_color").html(""); //.html('<b>Extraversion:</b> energy, positive emotions, surgency, assertiveness, sociability and the tendency to seek stimulation in the company of others, and talkativeness.');
    d3.select("#context_for_size").html('<b>Agreeableness:</b> a tendency to be compassionate and cooperative rather than suspicious and antagonistic towards others.');

    function getTrendline(xAttr, yAttr, type){
        var xData = [], yData = [];
        for(var kk = 0; kk < usersinfo.length; kk++){
            // if(type == "all"){
            //     xData.push(parseFloat(p_data[kk][xAttr]));
            //     yData.push(parseFloat(p_data[kk][yAttr]));
            // }
            // else if(type == "male"){
            //     if(personalities[kk]['demographics'].gender == 'm'){
            //         xData.push(parseFloat(p_data[kk][xAttr]));
            //         yData.push(parseFloat(p_data[kk][yAttr]));
            //     }
            // }
            // else{
            //     if(personalities[kk]['demographics'].gender == 'f'){
            //         xData.push(parseFloat(p_data[kk][xAttr]));
            //         yData.push(parseFloat(p_data[kk][yAttr]));
            //     }
            // }

            if(type == "all"){
                if(parseFloat(p_data[kk][xAttr]) >= 0 && parseFloat(p_data[kk][yAttr]) >= 0){
                    xData.push(coordinates_x_scale == "log"? Math.log10(parseFloat(p_data[kk][xAttr])) : parseFloat(p_data[kk][xAttr]));
                    yData.push(coordinates_y_scale == "log"? Math.log10(parseFloat(p_data[kk][yAttr])) : parseFloat(p_data[kk][yAttr]));
                }
            }
            else if(type == "male"){
                if('demographics' in personalities[kk] && personalities[kk]['demographics'].gender == 'm'){
                    if(parseFloat(p_data[kk][xAttr]) >= 0 && parseFloat(p_data[kk][yAttr]) >= 0){
                        xData.push(coordinates_x_scale == "log"? Math.log10(parseFloat(p_data[kk][xAttr])) : parseFloat(p_data[kk][xAttr]));
                        yData.push(coordinates_y_scale == "log"? Math.log10(parseFloat(p_data[kk][yAttr])) : parseFloat(p_data[kk][yAttr]));
                    }
                }
            }
            else{
                if('demographics' in personalities[kk] && personalities[kk]['demographics'].gender == 'f'){
                    if(parseFloat(p_data[kk][xAttr]) >= 0 && parseFloat(p_data[kk][yAttr]) >= 0){
                        xData.push(coordinates_x_scale == "log"? Math.log10(parseFloat(p_data[kk][xAttr])) : parseFloat(p_data[kk][xAttr]));
                        yData.push(coordinates_y_scale == "log"? Math.log10(parseFloat(p_data[kk][yAttr])) : parseFloat(p_data[kk][yAttr]));
                    }
                }
            }
        }
        if(xData.length <= 1) return null;
        var reducer = function(a, b) { return a + b; };
        var x_ave = xData.reduce(reducer) / xData.length;
        var y_ave = yData.reduce(reducer) / yData.length;
        var x_square = xData.map(function(d) { return Math.pow(d - x_ave, 2); })
            .reduce(reducer);
        var y_square = yData.map(function(d) { return Math.pow(d - y_ave, 2); })
            .reduce(reducer);
        var xy = xData.map(function(d, i) { return (d - x_ave) * (yData[i] - y_ave); })
            .reduce(reducer);
            
        var slope = xy / x_square;
        var intercept = y_ave - (x_ave * slope);
        var rSquare = Math.pow(xy, 2) / (x_square * y_square);
        
        return [slope, intercept, rSquare];
    }

    function update_yAxis(value){
        var this_yscale = yScale;
        if(coordinates_y_scale == "log"){ this_yscale = yScale_log; }
        switch(value){
            case 'Degree': 
                if(coordinates_y_scale == "log"){ 
                    this_yscale = d3.scale.log().base(10).range([p_height, 0]).nice();
                    this_yscale.domain([d3.min(p_data, function(d){ return d[value];})-10<0? 1:d3.min(p_data, function(d){ return d[value];})-10, d3.max(p_data, function(d){ return d[value];})]); 
                }
                else{
                    this_yscale = d3.scale.linear().range([p_height, 0]).nice();
                    this_yscale.domain([d3.min(p_data, function(d){ return d[value];})-10<0? 0:d3.min(p_data, function(d){ return d[value];})-10, d3.max(p_data, function(d){ return d[value];})]); 
                }
                var formatNumber = d3.format(",.0f");
                yAxis = d3.svg.axis().scale(this_yscale).orient("left").ticks(4, function(d) { return formatNumber(d) });
                break;
            case 'Betweenness': 
                if(coordinates_y_scale == "log"){ 
                    this_yscale = d3.scale.log().base(10).range([p_height, 0]).nice();
                    this_yscale.domain([(d3.min(p_data, function(d){ return d[value];})-0.1<=0 ? 0.0001 : d3.min(p_data, function(d){ return d[value];}))-0.1, d3.max(p_data, function(d){ return d[value];})]); 
                }
                else{
                    this_yscale = d3.scale.linear().range([p_height, 0]).nice();
                    this_yscale.domain([d3.min(p_data, function(d){ return d[value];})-0.1<0? 0:d3.min(p_data, function(d){ return d[value];})-0.1, d3.max(p_data, function(d){ return d[value];})]); 
                }
                var formatNumber = d3.format(",.4f");
                yAxis = d3.svg.axis().scale(this_yscale).orient("left").ticks(4, function(d) { return formatNumber(d) });
                break;
            case 'Gender':  
                yScale = d3.scale.ordinal().range([p_height, 0]).nice();
                yScale.domain(['m', 'f']); 
                yAxis = d3.svg.axis().scale(yScale).orient("left");
                break;
            case 'Age':  
                if(coordinates_y_scale == "log"){ 
                    this_yscale = d3.scale.log().base(10).range([p_height, 0]);
                }
                else{
                    this_yscale = d3.scale.linear().range([p_height, 0]);
                }
                this_yscale.domain([d3.min(p_data, function(d){ return d[value];}) - 1, d3.max(p_data, function(d){ return d[value];}) + 1]); 
                var formatNumber = d3.format(",.0f");
                yAxis = d3.svg.axis().scale(this_yscale).orient("left").ticks(5, function(d) { return formatNumber(d) });
                break;
            case 'Fairness':
            case 'Harm':
            case 'Loyalty':
            case 'Authority':
            case 'Purity':
                if(coordinates_y_scale == "log"){ 
                    this_yscale = d3.scale.log().base(10).range([p_height, 0]).nice();
                    this_yscale.domain([0.1, 5]); 
                }
                else{ 
                    this_yscale = d3.scale.linear().range([p_height, 0]).nice();
                    this_yscale.domain([0, 5]); 
                }
                var formatNumber = d3.format(",.1f");
                yAxis = d3.svg.axis().scale(this_yscale).orient("left").ticks(5, function(d) { return formatNumber(d) });
                break; 
            default: 
                if(coordinates_y_scale == "log"){ 
                    this_yscale = d3.scale.log().base(10).range([p_height, 0]).nice();
                    this_yscale.domain([0.1, 100]); 
                }
                else{ 
                    this_yscale = d3.scale.linear().range([p_height, 0]).nice();
                    this_yscale.domain([0, 100]); 
                }
                var formatNumber = d3.format(",.0f");
                yAxis = d3.svg.axis().scale(this_yscale).orient("left").ticks(5, function(d) { return formatNumber(d) });
        }
        return this_yscale;
    }
    function update_xAxis(value){
        var this_xscale = xScale;
        if(coordinates_x_scale == "log"){ this_xscale = xScale_log; }
        switch(value){
            case 'Degree': 
                if(coordinates_x_scale == "log"){ 
                    this_xscale = d3.scale.log().base(10).range([0, p_width]).nice(); 
                    this_xscale.domain([d3.min(p_data, function(d){ return d[value];})-10<0? 1:d3.min(p_data, function(d){ return d[value];})-10, d3.max(p_data, function(d){ return d[value];})]); 
                }
                else{
                    this_xscale = d3.scale.linear().range([0, p_width]).nice();
                    this_xscale.domain([d3.min(p_data, function(d){ return d[value];})-10<0? 0:d3.min(p_data, function(d){ return d[value];})-10, d3.max(p_data, function(d){ return d[value];})]); 
                }
                var formatNumber = d3.format(",.0f");
                xAxis = d3.svg.axis().scale(this_xscale).orient("bottom").ticks(4, function(d) { return formatNumber(d) });
                break;
            case 'Betweenness': 
                if(coordinates_x_scale == "log"){ 
                    this_xscale = d3.scale.log().base(10).range([0, p_width]).nice(); 
                    this_xscale.domain([(d3.min(p_data, function(d){ return d[value];})-0.1<=0 ? 0.0001 : d3.min(p_data, function(d){ return d[value];}))-10, d3.max(p_data, function(d){ return d[value];})]); 
                }
                else{
                    this_xscale = d3.scale.linear().range([0, p_width]).nice();
                    this_xscale.domain([d3.min(p_data, function(d){ return d[value];})-0.1<0? 0:d3.min(p_data, function(d){ return d[value];})-10, d3.max(p_data, function(d){ return d[value];})]); 
                }
                var formatNumber = d3.format(",.4f");
                xAxis = d3.svg.axis().scale(this_xscale).orient("bottom").ticks(4, function(d) { return formatNumber(d) });
                break;
            case 'Gender':  
                xScale = d3.scale.ordinal().range([0, p_width]).nice();
                xScale.domain(['m', 'f']); 
                xAxis = d3.svg.axis().scale(xScale).orient("bottom");
                break;
            case 'Age':  
                if(coordinates_x_scale == "log"){ 
                    this_xscale = d3.scale.log().base(10).range([0, p_width]).nice(); 
                }
                else{
                    this_xscale = d3.scale.linear().range([0, p_width]).nice();
                }
                this_xscale.domain([d3.min(p_data, function(d){ return d[value];}) - 1, d3.max(p_data, function(d){ return d[value];}) + 1]); 
                var formatNumber = d3.format(",.0f");
                xAxis = d3.svg.axis().scale(this_xscale).orient("bottom").ticks(5, function(d) { return formatNumber(d) });
                break;
            case 'Fairness':
            case 'Harm':
            case 'Loyalty':
            case 'Authority':
            case 'Purity':
                if(coordinates_x_scale == "log"){ 
                    this_xscale = d3.scale.log().base(10).range([0, p_width]).nice(); 
                    this_xscale.domain([0.1, 5]); 
                }
                else{
                    this_xscale = d3.scale.linear().range([0, p_width]).nice();
                    this_xscale.domain([0, 5]); 
                }
                var formatNumber = d3.format(",.1f");
                xAxis = d3.svg.axis().scale(this_xscale).orient("bottom").ticks(5, function(d) { return formatNumber(d) });
                break; 
            default: 
                if(coordinates_x_scale == "log"){ 
                    this_xscale = d3.scale.log().base(10).range([0, p_width]).nice(); 
                    this_xscale.domain([0.1, 100]); 
                }
                else{
                    this_xscale = d3.scale.linear().range([0, p_width]).nice();
                    this_xscale.domain([0, 100]); 
                }
                var formatNumber = d3.format(",.0f");
                xAxis = d3.svg.axis().scale(this_xscale).orient("bottom").ticks(5, function(d) { return formatNumber(d) });
                break; 
        }
        return this_xscale;
    }

    function yChange() {
        var value = this.value; // get the new y value
        if(value.indexOf(')') != -1){
            value = value.substring(value.indexOf(')') + 2, value.length);
        }
        var this_yscale = yScale;
        if(coordinates_y_scale == "log"){ this_yscale = yScale_log; }
        if(value == "Gender" && coordinates_y_scale == "log"){
            coordinates_y_scale = "linear";
            d3.select("#y_scale").select("#by_log").style("background-color", "rgba(184,184,184,0)");
            d3.select("#y_scale").select("#by_linear").style("background-color", "rgba(184,184,184,1)");
            this_yscale = yScale;
        }
        switch(value){
            case 'Degree': 
                // yScale = d3.scale.linear().range([p_height, 0]).nice();
                // yScale_log = d3.scale.log().base(10).range([p_height, 0]).nice();
                //yScale.domain([0, 1]);
                // yScale.domain([d3.min(p_data, function(d){ return d[value];}), d3.max(p_data, function(d){ return d[value];})]); 
                if(coordinates_y_scale == "log"){ 
                    this_yscale = d3.scale.log().base(10).range([p_height, 0]).nice();
                    this_yscale.domain([d3.min(p_data, function(d){ return d[value];})-10<0? 1:d3.min(p_data, function(d){ return d[value];})-10, d3.max(p_data, function(d){ return d[value];})]); 
                }
                else{
                    this_yscale = d3.scale.linear().range([p_height, 0]).nice();
                    this_yscale.domain([d3.min(p_data, function(d){ return d[value];})-10<0? 0:d3.min(p_data, function(d){ return d[value];})-10, d3.max(p_data, function(d){ return d[value];})]); 
                }
                var formatNumber = d3.format(",.0f");
                yAxis = d3.svg.axis().scale(this_yscale).orient("left").ticks(4, function(d) { return formatNumber(d) });
                //    .tickValues([0, 0.2, 0.4, 0.6, 0.8, 1]);
                break;
            case 'Betweenness': 
                // yScale = d3.scale.linear().range([p_height, 0]).nice();
                // yScale_log = d3.scale.log().base(10).range([p_height, 0]).nice();
                //yScale.domain([0, 1]); 
                // yScale.domain([d3.min(p_data, function(d){ return d[value];}), d3.max(p_data, function(d){ return d[value];})]); 
                if(coordinates_y_scale == "log"){ 
                    this_yscale = d3.scale.log().base(10).range([p_height, 0]).nice();
                    this_yscale.domain([(d3.min(p_data, function(d){ return d[value];})-0.1<=0 ? 0.0001 : d3.min(p_data, function(d){ return d[value];}))-0.1, d3.max(p_data, function(d){ return d[value];})]); 
                }
                else{
                    this_yscale = d3.scale.linear().range([p_height, 0]).nice();
                    this_yscale.domain([d3.min(p_data, function(d){ return d[value];})-0.1<0? 0:d3.min(p_data, function(d){ return d[value];})-0.1, d3.max(p_data, function(d){ return d[value];})]); 
                }
                // this_yscale.domain([d3.min(p_data, function(d){ return d[value];}), d3.max(p_data, function(d){ return d[value];})]); 
                var formatNumber = d3.format(",.4f");
                yAxis = d3.svg.axis().scale(this_yscale).orient("left").ticks(4, function(d) { return formatNumber(d) });
                //    .tickValues([0, 0.2, 0.4, 0.6, 0.8, 1]);
                break;
            case 'Gender':  
                yScale = d3.scale.ordinal().range([p_height, 0]).nice();
                yScale.domain(['m', 'f']); 
                yAxis = d3.svg.axis().scale(yScale).orient("left");
                break;
            case 'Age':  
                // yScale = d3.scale.linear().range([p_height, 0]);
                // yScale_log = d3.scale.log().base(10).range([p_height, 0]);
                if(coordinates_y_scale == "log"){ 
                    this_yscale = d3.scale.log().base(10).range([p_height, 0]);
                }
                else{
                    this_yscale = d3.scale.linear().range([p_height, 0]);
                }
                // yScale.domain([d3.min(p_data, function(d){ return d[value];}) - 1, d3.max(p_data, function(d){ return d[value];}) + 1]); 
                this_yscale.domain([d3.min(p_data, function(d){ return d[value];}) - 1, d3.max(p_data, function(d){ return d[value];}) + 1]); 
                var formatNumber = d3.format(",.0f");
                yAxis = d3.svg.axis().scale(this_yscale).orient("left").ticks(5, function(d) { return formatNumber(d) });
                break;
            case 'Fairness':
            case 'Harm':
            case 'Loyalty':
            case 'Authority':
            case 'Purity':
                if(coordinates_y_scale == "log"){ 
                    this_yscale = d3.scale.log().base(10).range([p_height, 0]).nice();
                    this_yscale.domain([0.1, 5]); 
                }
                else{ 
                    this_yscale = d3.scale.linear().range([p_height, 0]).nice();
                    this_yscale.domain([0, 5]); 
                }
                // this_yscale.ticks(5).map(this_yscale.tickFormat(5));
                var formatNumber = d3.format(",.1f");
                yAxis = d3.svg.axis().scale(this_yscale).orient("left").ticks(5, function(d) { return formatNumber(d) });
                break;
            default: 
                // yScale = d3.scale.linear().range([p_height, 0]).nice();
                // yScale_log = d3.scale.log().base(10).range([p_height, 0]).nice();
                if(coordinates_y_scale == "log"){ 
                    this_yscale = d3.scale.log().base(10).range([p_height, 0]).nice();
                    this_yscale.domain([0.1, 100]); 
                }
                else{ 
                    this_yscale = d3.scale.linear().range([p_height, 0]).nice();
                    this_yscale.domain([0, 100]); 
                }
                // this_yscale.ticks(5).map(this_yscale.tickFormat(5));
                var formatNumber = d3.format(",.0f");
                yAxis = d3.svg.axis().scale(this_yscale).orient("left").ticks(5, function(d) { return formatNumber(d) });
                    // .tickValues(function(){
                    //     if(coordinates_y_scale == "log") return [20, 40, 60, 80, 100];
                    //     else return [0, 20, 40, 60, 80, 100];
                    // });
        }
        d3.select("#analysis_personality_svg_cover").select(".y.axis")
          .transition().duration(500)
          .call(yAxis);
        d3.select("#analysis_personality_svg_cover").select('.y_label') // change the yAxisLabel
          .transition().duration(500)
          .text(value);    
        d3.select("#analysis_personality_svg_cover").selectAll('.dot') // move the circles
          .attr("opacity", function (d) { return isNaN(this_yscale(d[value]))? 0:1; })
          .transition().duration(500)
          .attr('cy',function (d) { return isNaN(this_yscale(d[value]))? -1000:this_yscale(d[value]); });
        d3.select("#analysis_personality_svg_cover").selectAll('.links') // move the circles
          .style("visibility", function (d) { 
            var id_pair = d3.select(this).attr("id");
            var n1 = id_pair.substring(id_pair.indexOf('link') + 4, id_pair.indexOf('_')), n2 = id_pair.substring(id_pair.indexOf('_')+1, id_pair.length);
            return isNaN(this_yscale(coordinates_data[n1][value]))||isNaN(this_yscale(coordinates_data[n2][value]))||coordinates_data[n1][value]<0||coordinates_data[n2][value]<0? "hidden":"visible"; 
          })
          .transition().duration(500)
          .attr('y1',function () { 
            var id_pair = d3.select(this).attr("id");
            var n1 = id_pair.substring(id_pair.indexOf('link') + 4, id_pair.indexOf('_')), n2 = id_pair.substring(id_pair.indexOf('_')+1, id_pair.length);
            return isNaN(this_yscale(coordinates_data[n1][value]))? -1000:this_yscale(coordinates_data[n1][value]); 
        }).attr('y2',function () { 
            var id_pair = d3.select(this).attr("id");
            var n1 = id_pair.substring(id_pair.indexOf('link') + 4, id_pair.indexOf('_')), n2 = id_pair.substring(id_pair.indexOf('_')+1, id_pair.length);
            return isNaN(this_yscale(coordinates_data[n2][value]))? -1000:this_yscale(coordinates_data[n2][value]); 
        });
        d3.select("#analysis_personality_svg_cover").selectAll('.dot_text') // move the circles
          .transition().duration(500)
          .attr("opacity", function (d) { return isNaN(this_yscale(d[value]))? 0:1; })
          .attr('y',function (d) { 
              var other_value2 = document.getElementById("sizeSelect").value;
              if(other_value2.indexOf(')') != -1){
                  other_value2 = other_value2.substring(other_value2.indexOf(')') + 2, other_value2.length);
              }
              switch(other_value2){
                  case "Degree":
                  case "Betweenness":
                      return (isNaN(this_yscale(d[value]))? -1000:this_yscale(d[value])) - (d[other_value2] * 12 + 4) - 4;
                      break;
                  default:
                      return (isNaN(this_yscale(d[value]))? -1000:this_yscale(d[value])) - (d[other_value2] / 100 * 12 + 4) - 4;
                      break;
              }
          });
        d3.select("#context_for_y").html(function(){
            switch(value){
                case 'Open-Mindedness': return '<b>Open-Mindedness:</b> appreciation for art, emotion, adventure, unusual ideas, curiosity, and variety of experience.'; break;
                case 'Conscientiousness': return '<b>Conscientiousness:</b> a tendency to be organized and dependable, show self-discipline, act dutifully, aim for achievement, and prefer planned rather than spontaneous behavior.'; break;
                case 'Extraversion': return '<b>Extraversion:</b> energy, positive emotions, surgency, assertiveness, sociability and the tendency to seek stimulation in the company of others, and talkativeness.'; break;
                case 'Agreeableness': return '<b>Agreeableness:</b> a tendency to be compassionate and cooperative rather than suspicious and antagonistic towards others.'; break;
                case 'Negative Emotionality': return '<b>Negative Emotionality:</b> the tendency to experience unpleasant emotions easily, such as anger, anxiety, depression, and vulnerability.'; break;
                //morality dimensions
                case 'Harm': return '<b>Harm:</b> cherishing and protecting others.'; break;
                case 'Fairness': return '<b>Fairness:</b> rendering justice according to shared rules.'; break;
                case 'Loyalty': return '<b>Loyalty:</b> standing with your group, family, nation.'; break;
                case 'Authority': return '<b>Authority:</b> submitting to tradition and legitimate authority.'; break;
                case 'Purity': return '<b>Purity:</b> abhorrence for disgusting things, foods, actions.'; break;
                case 'Degree': return '<b>Degree Centrality:</b> the number of links a node (member) has.'; break;
                case 'Betweenness': return '<b>Betweenness Centrality:</b> it quantifies the number of times a node acts as a bridge along the shortest path between two other nodes.'; break;
                default: return ""; 
            }
        });
        
        if(value != "Gender"){
            var other_value = document.getElementById("xSelect").value;
            if(other_value.indexOf(')') != -1){
                other_value = other_value.substring(other_value.indexOf(')') + 2, other_value.length);
            }
            var this_xscale = update_xAxis(other_value);
            var trendline = getTrendline(other_value, value, "all");
            if(trendline != null){
                var trend_x1 = this_xscale.domain()[0];
                var trend_y1 = trendline[0] * (coordinates_x_scale == "log" ? Math.log10(this_xscale.domain()[0]) : this_xscale.domain()[0]) + trendline[1];
                var trend_x2 = this_xscale.domain()[1];
                var trend_y2 = trendline[0] * (coordinates_x_scale == "log" ? Math.log10(this_xscale.domain()[1]) : this_xscale.domain()[1]) + trendline[1];
                p_svg.select(".trendline").transition().duration(500)
                    .attr("x1", function(d) { 
                        if(coordinates_y_scale == "log"){
                            return Math.pow(10, trend_y1) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - trendline[1]) / trendline[0]) : (Math.log10(this_yscale.domain()[0]) - trendline[1]) / trendline[0]) : this_xscale(trend_x1); 
                        }
                        else
                            return trend_y1 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (this_yscale.domain()[0] - trendline[1]) / trendline[0]) : (this_yscale.domain()[0] - trendline[1]) / trendline[0]) : this_xscale(trend_x1); 
                    })
                    .attr("y1", function(d) { 
                        if(coordinates_y_scale == "log"){
                            return Math.pow(10, trend_y1) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, trend_y1)); 
                        }
                        else
                            return trend_y1 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(trend_y1); 
                    })
                    .attr("x2", function(d) { 
                        if(coordinates_y_scale == "log"){
                            return Math.pow(10, trend_y2) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - trendline[1]) / trendline[0]) : (Math.log10(this_yscale.domain()[0]) - trendline[1]) / trendline[0]) : this_xscale(trend_x2); 
                        }
                        else
                            return trend_y2 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (this_yscale.domain()[0] - trendline[1]) / trendline[0]) : (this_yscale.domain()[0] - trendline[1]) / trendline[0]) : this_xscale(trend_x2); 

                    })
                    .attr("y2", function(d) { 
                        if(coordinates_y_scale == "log"){
                            return Math.pow(10, trend_y2) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, trend_y2)); 
                        }
                        else
                            return trend_y2 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(trend_y2); 
                    })
                    .style("display", "block");

                //if color selected as gender, draw two trendlines for male and ffemale
                if(document.getElementById("colorSelect").value == "Gender"){
                    var m_trendline = getTrendline(other_value, value, "male");
                    if(m_trendline != null){
                        var m_trend_x1 = this_xscale.domain()[0];
                        var m_trend_y1 = m_trendline[0] * (coordinates_x_scale == "log"? Math.log10(this_xscale.domain()[0]) : this_xscale.domain()[0]) + m_trendline[1];
                        var m_trend_x2 = this_xscale.domain()[1];
                        var m_trend_y2 = m_trendline[0] * (coordinates_x_scale == "log"? Math.log10(this_xscale.domain()[1]) : this_xscale.domain()[1]) + m_trendline[1];
                        p_svg.select(".m_trendline").transition().duration(500)
                            .attr("x1", function(d) { 
                                if(coordinates_y_scale == "log"){
                                    return Math.pow(10, m_trend_y1) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - m_trendline[1]) / m_trendline[0]) : (Math.log10(this_yscale.domain()[0]) - m_trendline[1]) / m_trendline[0]) : this_xscale(m_trend_x1); 
                                }
                                else
                                    return m_trend_y1 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (this_yscale.domain()[0] - m_trendline[1]) / m_trendline[0]) : (this_yscale.domain()[0] - m_trendline[1]) / m_trendline[0]) : this_xscale(m_trend_x1); 
                            })
                            .attr("y1", function(d) { 
                                if(coordinates_y_scale == "log"){
                                    return Math.pow(10, m_trend_y1) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, m_trend_y1)); 
                                }
                                else
                                    return m_trend_y1 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(m_trend_y1); 
                            })
                            .attr("x2", function(d) { 
                                if(coordinates_y_scale == "log"){
                                    return Math.pow(10, m_trend_y2) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - m_trendline[1]) / m_trendline[0]) : (Math.log10(this_yscale.domain()[0]) - m_trendline[1]) / m_trendline[0]) : this_xscale(m_trend_x2); 
                                }
                                else
                                    return m_trend_y2 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log" ? Math.pow(10, (this_yscale.domain()[0] - m_trendline[1]) / m_trendline[0]) : (this_yscale.domain()[0] - m_trendline[1]) / m_trendline[0]) : this_xscale(m_trend_x2); 
                            })
                            .attr("y2", function(d) { 
                                if(coordinates_y_scale == "log"){
                                    return Math.pow(10, m_trend_y2) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, m_trend_y2)); 
                                }
                                else
                                    return m_trend_y2 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(m_trend_y2);    
                            })//herehere
                            .style("display", "block");
                    }

                    var f_trendline = getTrendline(other_value, value, "female");
                    if(f_trendline != null){
                        var f_trend_x1 = this_xscale.domain()[0];
                        var f_trend_y1 = f_trendline[0] * (coordinates_x_scale == "log"? Math.log10(this_xscale.domain()[0]) : this_xscale.domain()[0]) + f_trendline[1];
                        var f_trend_x2 = this_xscale.domain()[1];
                        var f_trend_y2 = f_trendline[0] * (coordinates_x_scale == "log"? Math.log10(this_xscale.domain()[1]) : this_xscale.domain()[1]) + f_trendline[1];
                        p_svg.select(".f_trendline").transition().duration(500)
                            .attr("x1", function(d) { 
                                if(coordinates_y_scale == "log"){
                                    return Math.pow(10, f_trend_y1) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - f_trendline[1]) / f_trendline[0]) : (Math.log10(this_yscale.domain()[0]) - f_trendline[1]) / f_trendline[0]) : this_xscale(f_trend_x1); 
                                }
                                else
                                    return f_trend_y1 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (this_yscale.domain()[0] - f_trendline[1]) / f_trendline[0]) : (this_yscale.domain()[0] - f_trendline[1]) / f_trendline[0]) : this_xscale(f_trend_x1); 
                            })
                            .attr("y1", function(d) { 
                                if(coordinates_y_scale == "log"){
                                    return Math.pow(10, f_trend_y1) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, f_trend_y1)); 
                                }
                                else
                                    return f_trend_y1 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(f_trend_y1); 
                            })
                            .attr("x2", function(d) { 
                                if(coordinates_y_scale == "log"){
                                    return Math.pow(10, f_trend_y2) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - f_trendline[1]) / f_trendline[0]) : (Math.log10(this_yscale.domain()[0]) - f_trendline[1]) / f_trendline[0]) : this_xscale(f_trend_x2); 
                                }
                                else
                                    return f_trend_y2 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (this_yscale.domain()[0] - f_trendline[1]) / f_trendline[0]) : (this_yscale.domain()[0] - f_trendline[1]) / f_trendline[0]) : this_xscale(f_trend_x2); 
                            })
                            .attr("y2", function(d) { 
                                if(coordinates_y_scale == "log"){
                                    return Math.pow(10, f_trend_y2) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, f_trend_y2)); 
                                }
                                else
                                    return f_trend_y2 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(f_trend_y2); 
                            })
                            .style("display", "block");
                    }
                }
            }
        }
        else{
            p_svg.select(".trendline").style("display", "none");
            p_svg.select(".m_trendline").style("display", "none");
            p_svg.select(".f_trendline").style("display", "none");
        }
    }
    function xChange() {
        var value = this.value; // get the new x value
        if(value.indexOf(')') != -1){
            value = value.substring(value.indexOf(')') + 2, value.length);
        }
        var this_xscale = xScale;
        if(coordinates_x_scale == "log"){ this_xscale = xScale_log; }
        if(value == "Gender" && coordinates_x_scale == "log"){
            coordinates_x_scale = "linear";
            d3.select("#x_scale").select("#by_log").style("background-color", "rgba(184,184,184,0)");
            d3.select("#x_scale").select("#by_linear").style("background-color", "rgba(184,184,184,1)");
            this_xscale = xScale;
        }
        switch(value){
            case 'Degree': 
                // xScale = d3.scale.linear().range([0, p_width]).nice();
                // xScale_log = d3.scale.log().base(10).range([0, p_width]).nice();
                //xScale.domain([0, 1]);
                if(coordinates_x_scale == "log"){ 
                    this_xscale = d3.scale.log().base(10).range([0, p_width]).nice(); 
                    this_xscale.domain([d3.min(p_data, function(d){ return d[value];})-10<0? 1:d3.min(p_data, function(d){ return d[value];})-10, d3.max(p_data, function(d){ return d[value];})]); 
                }
                else{
                    this_xscale = d3.scale.linear().range([0, p_width]).nice();
                    this_xscale.domain([d3.min(p_data, function(d){ return d[value];})-10<0? 0:d3.min(p_data, function(d){ return d[value];})-10, d3.max(p_data, function(d){ return d[value];})]); 
                }
                // xScale.domain([d3.min(p_data, function(d){ return d[value];}), d3.max(p_data, function(d){ return d[value];})]); 
                var formatNumber = d3.format(",.0f");
                xAxis = d3.svg.axis().scale(this_xscale).orient("bottom").ticks(4, function(d) { return formatNumber(d) });
                // xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(4);
                //    .tickValues([0, 0.2, 0.4, 0.6, 0.8, 1]);
                break;
            case 'Betweenness': 
                // xScale = d3.scale.linear().range([0, p_width]).nice();
                // xScale_log = d3.scale.log().base(10).range([0, p_width]).nice();
                //xScale.domain([0, 1]); 
                if(coordinates_x_scale == "log"){ 
                    this_xscale = d3.scale.log().base(10).range([0, p_width]).nice(); 
                    this_xscale.domain([(d3.min(p_data, function(d){ return d[value];})-0.1<=0 ? 0.0001 : d3.min(p_data, function(d){ return d[value];}))-0.1, d3.max(p_data, function(d){ return d[value];})]); 
                }
                else{
                    this_xscale = d3.scale.linear().range([0, p_width]).nice();
                    this_xscale.domain([d3.min(p_data, function(d){ return d[value];})-0.1<0? 0:d3.min(p_data, function(d){ return d[value];})-0.1, d3.max(p_data, function(d){ return d[value];})]); 
                }
                // xScale.domain([d3.min(p_data, function(d){ return d[value];}), d3.max(p_data, function(d){ return d[value];})]); 
                // this_xscale.domain([d3.min(p_data, function(d){ return d[value];}), d3.max(p_data, function(d){ return d[value];})]); 
                var formatNumber = d3.format(",.4f");
                xAxis = d3.svg.axis().scale(this_xscale).orient("bottom").ticks(4, function(d) { return formatNumber(d) });
                // xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(4);
                //    .tickValues([0, 0.2, 0.4, 0.6, 0.8, 1]);
                break;
            case 'Gender':  
                xScale = d3.scale.ordinal().range([0, p_width]).nice();
                xScale.domain(['m', 'f']); 
                xAxis = d3.svg.axis().scale(xScale).orient("bottom");
                break;
            case 'Age':  
                // xScale = d3.scale.linear().range([0, p_width]).nice();
                // xScale_log = d3.scale.log().base(10).range([0, p_width]).nice();
                if(coordinates_x_scale == "log"){ 
                    this_xscale = d3.scale.log().base(10).range([0, p_width]).nice(); 
                }
                else{
                    this_xscale = d3.scale.linear().range([0, p_width]).nice();
                }
                // xScale.domain([d3.min(p_data, function(d){ return d[value];}) - 1, d3.max(p_data, function(d){ return d[value];}) + 1]); 
                this_xscale.domain([d3.min(p_data, function(d){ return d[value];}) - 1, d3.max(p_data, function(d){ return d[value];}) + 1]); 
                var formatNumber = d3.format(",.0f");
                xAxis = d3.svg.axis().scale(this_xscale).orient("bottom").ticks(5, function(d) { return formatNumber(d) });
                // xAxis = d3.svg.axis().scale(xScale).orient("bottom");
                break;
            case 'Fairness':
            case 'Harm':
            case 'Loyalty':
            case 'Authority':
            case 'Purity':
                if(coordinates_x_scale == "log"){ 
                    this_xscale = d3.scale.log().base(10).range([0, p_width]).nice(); 
                    this_xscale.domain([0.1, 5]); 
                }
                else{
                    this_xscale = d3.scale.linear().range([0, p_width]).nice();
                    this_xscale.domain([0, 5]); 
                }
                // xScale.domain([0, 100]); 
                // xScale_log.domain([0.1, 100]); 
                var formatNumber = d3.format(",.1f");
                xAxis = d3.svg.axis().scale(this_xscale).orient("bottom").ticks(5, function(d) { return formatNumber(d) });
                // xAxis = d3.svg.axis().scale(xScale).orient("bottom")
                //     .tickValues([0, 20, 40, 60, 80, 100]);
                break; 
            default: 
                // xScale = d3.scale.linear().range([0, p_width]).nice();
                // xScale_log = d3.scale.log().base(10).range([0, p_width]).nice();
                if(coordinates_x_scale == "log"){ 
                    this_xscale = d3.scale.log().base(10).range([0, p_width]).nice(); 
                    this_xscale.domain([0.1, 100]); 
                }
                else{
                    this_xscale = d3.scale.linear().range([0, p_width]).nice();
                    this_xscale.domain([0, 100]); 
                }
                // xScale.domain([0, 100]); 
                // xScale_log.domain([0.1, 100]); 
                var formatNumber = d3.format(",.0f");
                xAxis = d3.svg.axis().scale(this_xscale).orient("bottom").ticks(5, function(d) { return formatNumber(d) });
                // xAxis = d3.svg.axis().scale(xScale).orient("bottom")
                //     .tickValues([0, 20, 40, 60, 80, 100]);
                break; 
        }
        d3.select("#analysis_personality_svg_cover").select(".x.axis")
          .transition().duration(500)
          .call(xAxis);
        d3.select("#analysis_personality_svg_cover").select('.x_label') // change the xAxisLabel
          .transition().duration(500)
          .text(value);
        d3.select("#analysis_personality_svg_cover").selectAll('.dot') // move the circles
          .attr("opacity", function (d) { return isNaN(this_xscale(d[value]))? 0:1; })
          .transition().duration(500)
          .attr('cx',function (d) { return isNaN(this_xscale(d[value]))? -1000:this_xscale(d[value]); });
        d3.select("#analysis_personality_svg_cover").selectAll('.links') // move the circles
          .style("visibility", function (d) { 
            var id_pair = d3.select(this).attr("id");
            var n1 = id_pair.substring(id_pair.indexOf('link') + 4, id_pair.indexOf('_')), n2 = id_pair.substring(id_pair.indexOf('_')+1, id_pair.length);
            return isNaN(this_xscale(coordinates_data[n1][value]))||isNaN(this_xscale(coordinates_data[n2][value]))||coordinates_data[n1][value]<0||coordinates_data[n2][value]<0? "hidden":"visible"; 
          })
          .transition().duration(500)
          .attr('x1',function () { 
            var id_pair = d3.select(this).attr("id");
            var n1 = id_pair.substring(id_pair.indexOf('link') + 4, id_pair.indexOf('_')), n2 = id_pair.substring(id_pair.indexOf('_')+1, id_pair.length);
            return isNaN(this_xscale(coordinates_data[n1][value]))? -1000:this_xscale(coordinates_data[n1][value]); 
        }).attr('x2',function () { 
            var id_pair = d3.select(this).attr("id");
            var n1 = id_pair.substring(id_pair.indexOf('link') + 4, id_pair.indexOf('_')), n2 = id_pair.substring(id_pair.indexOf('_')+1, id_pair.length);
            return isNaN(this_xscale(coordinates_data[n2][value]))? -1000:this_xscale(coordinates_data[n2][value]); 
        });
        d3.select("#analysis_personality_svg_cover").selectAll('.dot_text') // move the circles
          .attr("opacity", function (d) { return isNaN(this_xscale(d[value]))? 0:1; })
          .transition().duration(500)
          .attr('x',function (d) { return (isNaN(this_xscale(d[value]))? -1000:this_xscale(d[value])) - 6; });
        d3.select("#context_for_x").html(function(){
            switch(value){
                case 'Open-Mindedness': return '<b>Open-Mindedness:</b> appreciation for art, emotion, adventure, unusual ideas, curiosity, and variety of experience.'; break;
                case 'Conscientiousness': return '<b>Conscientiousness:</b> a tendency to be organized and dependable, show self-discipline, act dutifully, aim for achievement, and prefer planned rather than spontaneous behavior.'; break;
                case 'Extraversion': return '<b>Extraversion:</b> energy, positive emotions, surgency, assertiveness, sociability and the tendency to seek stimulation in the company of others, and talkativeness.'; break;
                case 'Agreeableness': return '<b>Agreeableness:</b> a tendency to be compassionate and cooperative rather than suspicious and antagonistic towards others.'; break;
                case 'Negative Emotionality': return '<b>Negative Emotionality:</b> the tendency to experience unpleasant emotions easily, such as anger, anxiety, depression, and vulnerability.'; break;
                //morality dimensions
                case 'Harm': return '<b>Harm:</b> cherishing and protecting others.'; break;
                case 'Fairness': return '<b>Fairness:</b> rendering justice according to shared rules.'; break;
                case 'Loyalty': return '<b>Loyalty:</b> standing with your group, family, nation.'; break;
                case 'Authority': return '<b>Authority:</b> submitting to tradition and legitimate authority.'; break;
                case 'Purity': return '<b>Purity:</b> abhorrence for disgusting things, foods, actions.'; break;
                case 'Degree': return '<b>Degree Centrality:</b> the number of links a node (member) has.'; break;
                case 'Betweenness': return '<b>Betweenness Centrality:</b> it quantifies the number of times a node acts as a bridge along the shortest path between two other nodes.'; break;
                default: return ""; 
            }
        });
        if(value != "Gender"){
            var other_value = document.getElementById("ySelect").value;
            if(other_value.indexOf(')') != -1){
                other_value = other_value.substring(other_value.indexOf(')') + 2, other_value.length);
            }
            var this_yscale = update_yAxis(other_value);
            var trendline = getTrendline(value, other_value, "all");
            if(trendline != null){
                var trend_x1 = this_xscale.domain()[0];
                var trend_y1 = trendline[0] * (coordinates_x_scale == "log"? Math.log10(this_xscale.domain()[0]) : this_xscale.domain()[0]) + trendline[1];
                var trend_x2 = this_xscale.domain()[1];
                var trend_y2 = trendline[0] * (coordinates_x_scale == "log"? Math.log10(this_xscale.domain()[1]) : this_xscale.domain()[1]) + trendline[1];
                p_svg.select(".trendline").transition().duration(500)
                    .attr("x1", function(d) { 
                        if(coordinates_y_scale == "log"){
                            return Math.pow(10, trend_y1) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (this_yscale.domain()[0] - trendline[1]) / trendline[0]) : (this_yscale.domain()[0] - trendline[1]) / trendline[0]) : this_xscale(trend_x1); 
                        }
                        else
                            return trend_y1 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (this_yscale.domain()[0] - trendline[1]) / trendline[0]) : (this_yscale.domain()[0] - trendline[1]) / trendline[0]) : this_xscale(trend_x1); 
                    })
                    .attr("y1", function(d) { 
                        if(coordinates_y_scale == "log"){
                            return Math.pow(10, trend_y1) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, trend_y1)); 
                        }
                        else
                            return trend_y1 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(trend_y1); 
                    })
                    .attr("x2", function(d) { 
                        if(coordinates_y_scale == "log"){
                            return Math.pow(10, trend_y2) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (this_yscale.domain()[0] - trendline[1]) / trendline[0]) : (this_yscale.domain()[0] - trendline[1]) / trendline[0]) : this_xscale(trend_x2); 
                        }
                        else
                            return trend_y2 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (this_yscale.domain()[0] - trendline[1]) / trendline[0]) : (this_yscale.domain()[0] - trendline[1]) / trendline[0]) : this_xscale(trend_x2); 
                    })
                    .attr("y2", function(d) { 
                        if(coordinates_y_scale == "log"){
                            return Math.pow(10, trend_y2) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, trend_y2)); 
                        }
                        else
                            return trend_y2 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(trend_y2); 
                    })
                    .style("display", "block");

                //if color selected as gender
                if(document.getElementById("colorSelect").value == "Gender"){
                    var m_trendline = getTrendline(value, other_value, "male");
                    if(m_trendline != null){
                        var m_trend_x1 = this_xscale.domain()[0];
                        var m_trend_y1 = m_trendline[0] * (coordinates_x_scale == "log"? Math.log10(this_xscale.domain()[0]) : this_xscale.domain()[0]) + m_trendline[1];
                        var m_trend_x2 = this_xscale.domain()[1];
                        var m_trend_y2 = m_trendline[0] * (coordinates_x_scale == "log"? Math.log10(this_xscale.domain()[1]) : this_xscale.domain()[1]) + m_trendline[1];
                        p_svg.select(".m_trendline").transition().duration(500)
                            .attr("x1", function(d) { 
                                if(coordinates_y_scale == "log"){
                                    return Math.pow(10, m_trend_y1) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (this_yscale.domain()[0] - m_trendline[1]) / m_trendline[0]) : (this_yscale.domain()[0] - m_trendline[1]) / m_trendline[0]) : this_xscale(m_trend_x1); 
                                }
                                else
                                    return m_trend_y1 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (this_yscale.domain()[0] - m_trendline[1]) / m_trendline[0]) : (this_yscale.domain()[0] - m_trendline[1]) / m_trendline[0]) : this_xscale(m_trend_x1); 
                            })
                            .attr("y1", function(d) { 
                                if(coordinates_y_scale == "log"){
                                    return Math.pow(10, m_trend_y1) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, m_trend_y1)); 
                                }
                                else
                                    return m_trend_y1 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(m_trend_y1); 
                            })
                            .attr("x2", function(d) { 
                                if(coordinates_y_scale == "log"){
                                    return Math.pow(10, m_trend_y2) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (this_yscale.domain()[0] - m_trendline[1]) / m_trendline[0]) : (this_yscale.domain()[0] - m_trendline[1]) / m_trendline[0]) : this_xscale(m_trend_x2); 
                                }
                                else
                                    return m_trend_y2 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (this_yscale.domain()[0] - m_trendline[1]) / m_trendline[0]) : (this_yscale.domain()[0] - m_trendline[1]) / m_trendline[0]) : this_xscale(m_trend_x2); 
                            })
                            .attr("y2", function(d) { 
                                if(coordinates_y_scale == "log"){
                                    return Math.pow(10, m_trend_y2) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, m_trend_y2)); 
                                }
                                else
                                    return m_trend_y2 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(m_trend_y2); 
                            })
                            .style("display", "block");
                    }

                    var f_trendline = getTrendline(value, other_value, "female");
                    if(f_trendline != null){
                        var f_trend_x1 = this_xscale.domain()[0];
                        var f_trend_y1 = f_trendline[0] * (coordinates_x_scale == "log"? Math.log10(this_xscale.domain()[0]) : this_xscale.domain()[0]) + f_trendline[1];
                        var f_trend_x2 = this_xscale.domain()[1];
                        var f_trend_y2 = f_trendline[0] * (coordinates_x_scale == "log"? Math.log10(this_xscale.domain()[1]) : this_xscale.domain()[1]) + f_trendline[1];
                        p_svg.select(".f_trendline").transition().duration(500)
                            .attr("x1", function(d) { 
                                if(coordinates_y_scale == "log"){
                                    return Math.pow(10, f_trend_y1) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - f_trendline[1]) / f_trendline[0]) : (Math.log10(this_yscale.domain()[0]) - f_trendline[1]) / f_trendline[0]) : this_xscale(f_trend_x1); 
                                }
                                else
                                    return f_trend_y1 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (this_yscale.domain()[0] - f_trendline[1]) / f_trendline[0]) : (this_yscale.domain()[0] - f_trendline[1]) / f_trendline[0]) : this_xscale(f_trend_x1); 
                            })
                            .attr("y1", function(d) { 
                                if(coordinates_y_scale == "log"){
                                    return Math.pow(10, f_trend_y1) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, f_trend_y1)); 
                                }
                                else
                                    return f_trend_y1 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(f_trend_y1); 
                            })
                            .attr("x2", function(d) { 
                                if(coordinates_y_scale == "log"){
                                    return Math.pow(10, f_trend_y2) < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (Math.log10(this_yscale.domain()[0]) - f_trendline[1]) / f_trendline[0]) : (Math.log10(this_yscale.domain()[0]) - f_trendline[1]) / f_trendline[0]) : this_xscale(f_trend_x2); 
                                }
                                else
                                    return f_trend_y2 < this_yscale.domain()[0] ? this_xscale(coordinates_x_scale == "log"? Math.pow(10, (this_yscale.domain()[0] - f_trendline[1]) / f_trendline[0]) : (this_yscale.domain()[0] - f_trendline[1]) / f_trendline[0]) : this_xscale(f_trend_x2); 
                            })
                            .attr("y2", function(d) { 
                                if(coordinates_y_scale == "log"){
                                    return Math.pow(10, f_trend_y2) < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(Math.pow(10, f_trend_y2)); 
                                }
                                else
                                    return f_trend_y2 < this_yscale.domain()[0] ? this_yscale(this_yscale.domain()[0]) : this_yscale(f_trend_y2); 
                            })
                            .style("display", "block");
                    }
                }
            }
        }
        else{
            p_svg.select(".trendline").style("display", "none");
            p_svg.select(".m_trendline").style("display", "none");
            p_svg.select(".f_trendline").style("display", "none");
        }
    }
    function colorChange(){
        var value = this.value;
        if(value.indexOf(')') != -1){
            value = value.substring(value.indexOf(')') + 2, value.length);
        }
        var nn = 0;
        key.select("#gradient_rect").style("display", "block");
        key.select("#gradient_y_axis").style("display", "block");
        key.select("#for_gender").style("display", "none");
        switch(value){
            case 'Degree': 
                nn = 5;
                legend.select("#stop1").attr("stop-color", colors[nn]).attr("stop-opacity", 1);
                legend.select("#stop0").attr("stop-color", colors[nn]).attr("stop-opacity", 0);
                //y2 = d3.scale.linear().range([0, h-20]).domain([1, 0]);
                y2 = d3.scale.linear().range([0, h-20]).domain([d3.min(p_data, function(d){ return d[value];}), d3.max(p_data, function(d){ return d[value];})]); 
                yAxis2 = d3.svg.axis().scale(y2).orient("right").ticks(3);
                key.select(".y2.axis").call(yAxis2);
                break;
            case 'Betweenness': 
                nn = 5;
                legend.select("#stop1").attr("stop-color", colors[nn]).attr("stop-opacity", 1);
                legend.select("#stop0").attr("stop-color", colors[nn]).attr("stop-opacity", 0);
                //y2 = d3.scale.linear().range([0, h-20]).domain([1, 0]);
                y2 = d3.scale.linear().range([0, h-20]).domain([d3.min(p_data, function(d){ return d[value];}), d3.max(p_data, function(d){ return d[value];})]); 
                yAxis2 = d3.svg.axis().scale(y2).orient("right").ticks(3);
                key.select(".y2.axis").call(yAxis2);
                break;
            case 'Gender':  
                nn = -1;
                key.select("#gradient_rect").style("display", "none");
                key.select("#gradient_y_axis").style("display", "none");
                key.select("#for_gender").style("display", "block");
                break;
            case 'Age':
                nn = 5;
                legend.select("#stop1").attr("stop-color", colors[nn]).attr("stop-opacity", 1);
                legend.select("#stop0").attr("stop-color", colors[nn]).attr("stop-opacity", 0);
                y2 = d3.scale.linear().range([0, h-20]).domain([d3.min(p_data, function(d){ return d[value];}) - 1, d3.max(p_data, function(d){ return d[value];}) + 1]);
                yAxis2 = d3.svg.axis().scale(y2).orient("right").ticks(3);
                key.select(".y2.axis").call(yAxis2);
                break;
            default:
                switch(value){
                    case 'Open-Mindedness': nn = 0; break;
                    case 'Conscientiousness': nn = 1; break;
                    case 'Extraversion': nn = 2; break;
                    case 'Agreeableness': nn = 3; break;
                    case 'Negative Emotionality': nn = 4; break;
                    default: nn = 5; 
                }
                legend.select("#stop1").attr("stop-color", colors[nn]).attr("stop-opacity", 1);
                legend.select("#stop0").attr("stop-color", colors[nn]).attr("stop-opacity", 0);
                y2 = d3.scale.linear().range([0, h-20]).domain([100, 0]);
                yAxis2 = d3.svg.axis().scale(y2).orient("right").ticks(3);
                key.select(".y2.axis").call(yAxis2);
                break; 
        }
        d3.selectAll('.dot') // move the circles
          .transition().duration(500)
          .style("fill", function(d){
              if(nn != -1){ return colors[nn]; }
              else{
                  return (d['Gender'] == "m"? colors[0]:colors[3]);
              }
          })
          .style('opacity',function (d) { 
              if(nn != -1){
                  if(nn < 5) return parseFloat(d[value])/parseFloat(100);
                  else
                    switch(value){
                        case 'Degree': return d[value]; break;
                        case 'Betweenness': return d[value]; break;
                        case 'Age': return parseFloat(d[value])/parseFloat(100); break;
                        default: return nn = 5; 
                    }
              }
              else{
                  return "1";
              }
          });
          d3.select("#context_for_color").html(function(){
            switch(value){
                case 'Open-Mindedness': return '<b>Open-Mindedness:</b> appreciation for art, emotion, adventure, unusual ideas, curiosity, and variety of experience.'; break;
                case 'Conscientiousness': return '<b>Conscientiousness:</b> a tendency to be organized and dependable, show self-discipline, act dutifully, aim for achievement, and prefer planned rather than spontaneous behavior.'; break;
                case 'Extraversion': return '<b>Extraversion:</b> energy, positive emotions, surgency, assertiveness, sociability and the tendency to seek stimulation in the company of others, and talkativeness.'; break;
                case 'Agreeableness': return '<b>Agreeableness:</b> a tendency to be compassionate and cooperative rather than suspicious and antagonistic towards others.'; break;
                case 'Negative Emotionality': return '<b>Negative Emotionality:</b> the tendency to experience unpleasant emotions easily, such as anger, anxiety, depression, and vulnerability.'; break;
                //morality dimensions
                case 'Harm': return '<b>Harm:</b> cherishing and protecting others.'; break;
                case 'Fairness': return '<b>Fairness:</b> rendering justice according to shared rules.'; break;
                case 'Loyalty': return '<b>Loyalty:</b> standing with your group, family, nation.'; break;
                case 'Authority': return '<b>Authority:</b> submitting to tradition and legitimate authority.'; break;
                case 'Purity': return '<b>Purity:</b> abhorrence for disgusting things, foods, actions.'; break;
                case 'Degree': return '<b>Degree Centrality:</b> the number of links a node (member) has.'; break;
                case 'Betweenness': return '<b>Betweenness Centrality:</b> it quantifies the number of times a node acts as a bridge along the shortest path between two other nodes.'; break;
                default: return ""; 
            }
        });

        if(document.getElementById("colorSelect").value != "Gender"){
            p_svg.select(".f_trendline").style("display", "none");
            p_svg.select(".m_trendline").style("display", "none");
        }
        else{
            p_svg.select(".f_trendline").style("display", "block");
            p_svg.select(".m_trendline").style("display", "block");
        }
    }
    function sizeChange(){
        var value = this.value;
        if(value.indexOf(')') != -1){
            value = value.substring(value.indexOf(')') + 2, value.length);
        }
        switch(value){
            case 'Degree': 
                var min = d3.min(p_data, function(d){ return d[value];}), max = d3.max(p_data, function(d){ return d[value];});
                d3.range(4).forEach(function(i){
                    legend_size.select("#ctag_" + i)
                        .text(parseInt((3 - i) * (max - min) / 3 + 1));
                });
                d3.selectAll('.dot') // move the circles
                    .transition().duration(500)
                    .attr("r", function(d){
                        return d[value] * 12 / (max) + 4;
                });
                break;
            case 'Betweenness':
                var min = d3.min(p_data, function(d){ return d[value];}), max = d3.max(p_data, function(d){ return d[value];});
                d3.range(4).forEach(function(i){
                    legend_size.select("#ctag_" + i)
                        .text((max - (max - min) / 3 * i).toFixed(2));
                });
                d3.selectAll('.dot') // move the circles
                    .transition().duration(500)
                    .attr("r", function(d){
                        return d[value] * 12 / (max) + 4;
                });
                break;
            case 'Age':
                var min = 10 * parseInt(Math.floor(d3.min(p_data, function(d){ return d[value];})/10)), max = 10 * parseInt(Math.ceil((d3.max(p_data, function(d){ return d[value];}))/10));
                d3.range(4).forEach(function(i){
                    legend_size.select("#ctag_" + i)
                        .text(parseInt(max - (max - min) / 3 * i));
                });
                d3.selectAll('.dot') // move the circles
                    .transition().duration(500)
                    .attr("r", function(d){
                        return d[value] * 12 / (max) + 4;
                });
                break;
            default:
                d3.range(4).forEach(function(i){
                    legend_size.select("#ctag_" + i)
                        .text(parseInt((3 - i) *33 + 1));
                });
                d3.selectAll('.dot') // move the circles
                    .transition().duration(500)
                    .attr("r", function(d){
                        return d[value] / 100 * 12 + 4;
                });
                break; 
        }
        d3.select("#context_for_size").html(function(){
            switch(value){
                case 'Open-Mindedness': return '<b>Open-Mindedness:</b> appreciation for art, emotion, adventure, unusual ideas, curiosity, and variety of experience.'; break;
                case 'Conscientiousness': return '<b>Conscientiousness:</b> a tendency to be organized and dependable, show self-discipline, act dutifully, aim for achievement, and prefer planned rather than spontaneous behavior.'; break;
                case 'Extraversion': return '<b>Extraversion:</b> energy, positive emotions, surgency, assertiveness, sociability and the tendency to seek stimulation in the company of others, and talkativeness.'; break;
                case 'Agreeableness': return '<b>Agreeableness:</b> a tendency to be compassionate and cooperative rather than suspicious and antagonistic towards others.'; break;
                case 'Negative Emotionality': return '<b>Negative Emotionality:</b> the tendency to experience unpleasant emotions easily, such as anger, anxiety, depression, and vulnerability.'; break;
                //morality dimensions
                case 'Harm': return '<b>Harm:</b> cherishing and protecting others.'; break;
                case 'Fairness': return '<b>Fairness:</b> rendering justice according to shared rules.'; break;
                case 'Loyalty': return '<b>Loyalty:</b> standing with your group, family, nation.'; break;
                case 'Authority': return '<b>Authority:</b> submitting to tradition and legitimate authority.'; break;
                case 'Purity': return '<b>Purity:</b> abhorrence for disgusting things, foods, actions.'; break;
                case 'Degree': return '<b>Degree Centrality:</b> the number of links a node (member) has.'; break;
                case 'Betweenness': return '<b>Betweenness Centrality:</b> it quantifies the number of times a node acts as a bridge along the shortest path between two other nodes.'; break;
                default: return ""; 
            }
        });
    }
    document.getElementById("ySelect").selectedIndex = "1";
    document.getElementById("colorSelect").selectedIndex = "13"; //2
    document.getElementById("sizeSelect").selectedIndex = "3";
};
var show_table_results = function(){
    d3.select("#analysis_table_cover").style("display", "none");
    var table = document.getElementById("analysis_table"), col_len = 22;
    d3.range(usersinfo.length).forEach(function(i){
        var row = table.insertRow(i+1);
        for(var j = 0; j <col_len; j++){
            var cell = row.insertCell(j);
            if(JSON.stringify(personalities[i]) != JSON.stringify({})){
                switch(j){
                    case 0: cell.innerHTML = (demo == 1? demo_people_names_match[usersinfo[i]['name']]:usersinfo[i]['name']); break;
                    case 1: cell.innerHTML = centralities[i]['degree']; break;
                    case 2: cell.innerHTML = parseFloat(centralities[i]['betweenness'].toFixed(2)); break;
                    case 3: cell.innerHTML = personalities[i]['personality']['Open-Mindedness']; break;
                    case 4: cell.innerHTML = personalities[i]['personality']['Conscientiousness']; break;
                    case 5: cell.innerHTML = personalities[i]['personality']['Extraversion']; break;
                    case 6: cell.innerHTML = personalities[i]['personality']['Agreeableness']; break;
                    case 7: cell.innerHTML = personalities[i]['personality']['Negative Emotionality']; break;
                    case 8: cell.innerHTML = 'Fairness' in moralities[i]? parseFloat(moralities[i]['Fairness'].toFixed(2)):""; break;
                    case 9: cell.innerHTML = 'Harm' in moralities[i]? parseFloat(moralities[i]['Harm'].toFixed(2)):""; break;
                    case 10: cell.innerHTML = 'Loyalty' in moralities[i]? parseFloat(moralities[i]['Loyalty'].toFixed(2)):""; break;
                    case 11: cell.innerHTML = 'Authority' in moralities[i]? parseFloat(moralities[i]['Authority'].toFixed(2)):""; break;
                    case 12: cell.innerHTML = 'Purity' in moralities[i]? parseFloat(moralities[i]['Purity'].toFixed(2)):""; break;
                    case 13: cell.innerHTML = personalities[i]['demographics']['age']; break;
                    case 14: cell.innerHTML = personalities[i]['demographics']['gender']; break;
                    case 15: cell.innerHTML = 'nationality' in demographics[i]? demographics[i]['nationality']:""; break;
                    case 16: cell.innerHTML = 'ethnicity' in demographics[i]?demographics[i]['ethnicity']:""; break;
                    case 17: cell.innerHTML = 'languages' in demographics[i]?demographics[i]['languages'].join(', '):""; break;
                    case 18: cell.innerHTML = 'major_college' in demographics[i]?demographics[i]['major_college']:""; break;
                    case 19: cell.innerHTML = 'major_graduate' in demographics[i]?demographics[i]['major_graduate']:""; break;
                    case 20: cell.innerHTML = 'degree' in demographics[i]?demographics[i]['degree']:""; break;
                    case 21: cell.innerHTML = 'position' in demographics[i]?demographics[i]['position']:""; break;
                    default: cell.innerHTML = "";
                }
            }
            else{
                switch(j){
                    case 0: cell.innerHTML = (demo == 1? demo_people_names_match[usersinfo[i]['name']]:usersinfo[i]['name']); break;
                    case 1: cell.innerHTML = centralities[i]['degree']; break;
                    case 2: cell.innerHTML = centralities[i]['betweenness'].toFixed(2); break;
                    case 3: cell.innerHTML = ""; break;
                    case 4: cell.innerHTML = ""; break;
                    case 5: cell.innerHTML = ""; break;
                    case 6: cell.innerHTML = ""; break;
                    case 7: cell.innerHTML = ""; break;
                    case 8: cell.innerHTML = ""; break;
                    case 9: cell.innerHTML = ""; break;
                    case 10: cell.innerHTML = ""; break;
                    case 11: cell.innerHTML = ""; break;
                    case 12: cell.innerHTML = ""; break;
                    case 13: cell.innerHTML = ""; break;
                    case 14: cell.innerHTML = ""; break;
                    case 15: cell.innerHTML = ""; break;
                    case 16: cell.innerHTML = ""; break;
                    case 17: cell.innerHTML = ""; break;
                    case 18: cell.innerHTML = ""; break;
                    case 19: cell.innerHTML = ""; break;
                    case 20: cell.innerHTML = ""; break;
                    case 21: cell.innerHTML = ""; break;
                    default: cell.innerHTML = "";
                }
            }
        }
    });
    d3.select("#download_button").style("left", "62px").style("top", "0px")
      .on("click", function(){
            var csvContent = "data:text/csv;charset=utf-8,";
            function ConvertToCSV(userArray, personArray, centralArray, moralArray, demoArray) {
                var u_array = typeof userArray != 'object' ? JSON.parse(userArray) : userArray;
                var headers = Object.keys(userArray[0]).concat(Object.keys(centralArray[0]))
                    .concat(Object.keys(personArray[0]['demographics']))
                    .concat(Object.keys(personArray[0]['personality']))
                    .concat(Object.keys(moralArray[0]))
                    .concat(['academic_degree', 'major_college', 'major_graduate', 'nationality','position']); //
                var str = '';console.log(headers);
                for (var i = 0; i < headers.length; i++) {
                    if (str != '') str += ',';
                    str += headers[i];
                }
                str += '\r\n';
                for (var i = 0; i < u_array.length; i++) {
                    var line = '';
                    for(var j = 0; j < headers.length; j++){
                        if(headers[j] in u_array[i]){
                            if(headers[j])
                            if (line != '') line += ',';
                            line += u_array[i][headers[j]];
                        }
                        else if(headers[j] in centralArray[i]){
                            line += ',';
                            line += centralArray[i][headers[j]];
                        }
                        else if(j >= 8 && j < 16 && JSON.stringify(personArray[i]) != JSON.stringify({})){
                            if(headers[j] in personArray[i]['demographics']){
                                line += ',';
                                line += personArray[i]['demographics'][headers[j]];
                            }
                            else if(headers[j] in personArray[i]['personality']){
                                line += ',';
                                line += personArray[i]['personality'][headers[j]];
                            }
                            else line += ',';
                            // if(headers[j] in moralArray[i]){
                            //     line += ',';
                            //     line += moralArray[i][headers[j]];
                            // }
                            // if(headers[j] in demolArray[i]){
                            //     line += ',';
                            //     line += demoArray[i][headers[j]];
                            // }
                        }
                        else if(j == 8){
                            line += ',,,,,,,,';
                        }
                        else if(j >= 16 && j < 21 && JSON.stringify(moralArray[i]) != JSON.stringify({})){
                            if(headers[j] in moralArray[i]){
                                line += ',';
                                line += moralArray[i][headers[j]];
                            }
                            else line += ',';
                            // if(headers[j] in demolArray[i]){
                            //     line += ',';
                            //     line += demoArray[i][headers[j]];
                            // }
                        }
                        else if(j == 16){
                            line += ',,,,,';
                        }
                        else if(j >= 21 && JSON.stringify(demoArray[i]) != JSON.stringify({})){
                            if(headers[j] == "academic_degree"){
                                line += ',';
                                line += demoArray[i]["degree"];
                            }
                            else if(headers[j] in demoArray[i]){
                                line += ',';
                                line += demoArray[i][headers[j]];
                            }
                            else line += ',';
                        }
                        else if(j == 21){
                            line += ',,,,,';
                        }
                    }
                    str += line + '\r\n';
                }
                return str;
            }
            csvContent += ConvertToCSV(usersinfo, personalities, centralities, moralities, demographics);//console.log(csvContent);
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "teamsData.csv");
            document.body.appendChild(link); // Required for FF
            link.click();
    });
};
var show_pairs_results = function(){
    for(var k = 0; k < pairs.length; k++){
        pairs[k]['emails'] = new Array(pairs[k]['emails_to'].length);
        for(var l = 0; l < pairs[k]['emails'].length; l++){
            var mean = Math.sqrt((Math.pow(pairs[k]['emails_to'][l], 2) + Math.pow(pairs[k]['emails_from'][l], 2)) / 2); //quardratic mean
            // pairs[k]['emails'][l] = Math.log(mean == 0 ? 0.1:mean);
            pairs[k]['emails'][l] = mean;
            // pairs[k]['emails'][l] = Math.log(pairs[k]['emails'][l] + 1);
        }
    }
/*
    var csvContent = "data:text/csv;charset=utf-8,";
    var headers = ["member A", "member B"].concat(pairs[0]['time']);
    var str = '';
    for (var i = 0; i < headers.length; i++) {
        if (str != '') str += ',';
        if(i>=2) str += headers[i].substring(0,4);
        else str += headers[i];
    }
    str += '\r\n';
    for (var i = 0; i < pairs.length; i++) {
        var line = '';
        line += pairs[i]['pair'].substring(0, pairs[i]['pair'].indexOf('+'));
        line += ',';
        line += pairs[i]['pair'].substring(pairs[i]['pair'].indexOf('+')+1, pairs[i]['pair'].length);
        for(var j = 2; j < headers.length; j++){
            line += ',';
            line += pairs[i]['emails'][j-2];
        }
        str += line + '\r\n';
    }
    csvContent += str;
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "pairsData.csv");
    document.body.appendChild(link); // Required for FF
    link.click();
*/

    var selectData = [{"text": "All"}];
    for(var k = 0; k < usersinfo.length; k++){
        selectData.push({"text": (demo == 1? demo_people_names_match[usersinfo[k]['name']]:usersinfo[k]['name'])});
    }
    var p1Input = d3.select("#p1Select").on('change',p1Change)
    .selectAll('option')
      .data(selectData)
      .enter()
    .append('option')
      .attr('value', function (d) { return d.text; })
      .text(function (d) { return d.text ;});
    var yp2Input = d3.select("#p2Select").on('change',p2Change)
    .selectAll('option')
      .data(selectData)
      .enter()
    .append('option')
      .attr('value', function (d) { return d.text; })
      .text(function (d) { return d.text ;});
    
    function p1Change() {
        var value = this.value;
        pair_p1 = value;
        pair_p2 = document.getElementById("p2Select").value;

        var current_yscale = yScale, current_line = valueline;
        if(current_pair_scale == "linear"){
            current_yscale = yScale_linear; 
            current_line = valueline_linear;
        }
        if(demo == 1){
            for(var name in demo_people_names_match){
                if(pair_p1 != "All" && demo_people_names_match[name] == pair_p1){
                    pair_p1 = name; value = name;
                }
                if(pair_p2 != "All" && demo_people_names_match[name] == pair_p2){
                    pair_p2 = name; 
                }
            }
        }
        if(value == "All" && pair_p2 == "All"){
            //same as restore
            for(var k = 0; k < pairs.length; k++){
                var pp1 = pairs[k]['pair'].substring(0, pairs[k]['pair'].indexOf("+")), 
                    pp2 = pairs[k]['pair'].substring(pairs[k]['pair'].indexOf("+") + 1, pairs[k]['pair'].length);
                p_svg.select("#curve_" + k).style("stroke", combineColor(pp1,pp2)).style("stroke-width", "2").style("display", "block");
                p_svg.select("#line_pair" + k).style("stroke", combineColor(pp1,pp2)).style("display", "block");
                p_svg.select("#circle_" + k + "_1").style("stroke", color(pp1)).style("display", "block");
                p_svg.select("#circle_" + k + "_2").style("stroke", color(pp2)).style("display", "block");
            }
            yScale.domain([0.1, d3.max(pairs, function(d) { return d3.max(d['emails']); })]);
            p_svg.select(".y.axis")
                .transition().duration(1000)
                .call(yAxis);
            for(var k = 0; k < pairs.length; k++){
                var data = [];
                for(var r = start_index; r < pairs[0]['time'].length; r++) data.push({time: new Date(pairs[k]['time'][r]), emails: pairs[k]['emails'][r]});
                p_svg.select("#curve_" + k).transition().duration(1000).attr("d", current_line(data));
                p_svg.select("#line_pair" + k).transition().duration(1000).attr("y1", current_yscale(pairs[k]['emails'][pairs[k]['emails'].length-1])).attr("y2", current_yscale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
                p_svg.select("#circle_" + k + "_1").transition().duration(1000).attr("cy", current_yscale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
                p_svg.select("#circle_" + k + "_2").transition().duration(1000).attr("cy", current_yscale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
            }
        }
        else if((value == "All" && pair_p2 != "All") || (value != "All" && pair_p2 == "All")){
            //see all related to one member
            var max = 0;
            var p1 = (value == "All"? pair_p2:pair_p1);
            // if(demo == 1){
            //     for(var name in demo_people_names_match){
            //         if(demo_people_names_match[name] == p1){
            //             p1 = name; break;
            //         }
            //     }
            // }
            for(var k = 0; k < pairs.length; k++){
                if(pairs[k]['pair'].indexOf(p1) == -1){
                    p_svg.select("#curve_" + k).style("stroke", "rgb(200,200,200)").style("stroke-width", 1).style("display", "none");
                    p_svg.select("#line_pair" + k).style("stroke", "rgb(200,200,200)").style("display", "none");
                    p_svg.select("#circle_" + k + "_1").style("stroke", "rgb(200,200,200)").style("display", "none");
                    p_svg.select("#circle_" + k + "_2").style("stroke", "rgb(200,200,200)").style("display", "none");
                }
                else{
                    if(d3.max(pairs[k]['emails']) > max) max = d3.max(pairs[k]['emails']);
                    var pp1 = pairs[k]['pair'].substring(0, pairs[k]['pair'].indexOf("+")), 
                        pp2 = pairs[k]['pair'].substring(pairs[k]['pair'].indexOf("+") + 1, pairs[k]['pair'].length);
                    p_svg.select("#curve_" + k).style("stroke", combineColor(pp1,pp2)).style("stroke-width", "2").style("display", "block");
                    p_svg.select("#line_pair" + k).style("stroke", combineColor(pp1,pp2)).style("display", "block");
                    p_svg.select("#circle_" + k + "_1").style("stroke", color(pp1)).style("display", "block");
                    p_svg.select("#circle_" + k + "_2").style("stroke", color(pp2)).style("display", "block");
                }
            }
            yScale.domain([0.1, max]);
            p_svg.select(".y.axis")
                .transition().duration(1000)
                .call(yAxis);
            for(var k = 0; k < pairs.length; k++){
                var data = [];
                for(var r = start_index; r < pairs[0]['time'].length; r++) data.push({time: new Date(pairs[k]['time'][r]), emails: pairs[k]['emails'][r]});
                p_svg.select("#curve_" + k).transition().duration(1000).attr("d", valueline(data));
                p_svg.select("#line_pair" + k).transition().duration(1000).attr("y1", yScale(pairs[k]['emails'][pairs[k]['emails'].length-1])).attr("y2", yScale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
                p_svg.select("#circle_" + k + "_1").transition().duration(1000).attr("cy", yScale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
                p_svg.select("#circle_" + k + "_2").transition().duration(1000).attr("cy", yScale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
            }
        }
        else{
            //see only this pair
            // if(demo == 1){
            //     for(var name in demo_people_names_match){
            //         if(demo_people_names_match[name] == pair_p1){
            //             pair_p1 = name; 
            //         }
            //         if(demo_people_names_match[name] == pair_p2){
            //             pair_p2 = name; 
            //         }
            //     }
            // }
            if(pair_p1 == pair_p2){
                p_svg.selectAll(".line").style("stroke", "rgb(200,200,200)").style("stroke-width", 1).style("display", "none");//.style("opacity", 0.1);
                p_svg.selectAll(".line").style("stroke", "rgb(200,200,200)").style("display", "none");
                // p_svg.select("#circle_" + k + "_1").style("stroke", "rgb(200,200,200)").style("display", "none");
                // p_svg.select("#circle_" + k + "_2").style("stroke", "rgb(200,200,200)").style("display", "none");
            }
            else{
                var t = -1;
                for(var k = 0; k < pairs.length; k++){
                    if(pairs[k]['pair'].indexOf(pair_p1) != -1 && pairs[k]['pair'].indexOf(pair_p2) != -1) t = k;
                }
                 
                for(var k = 0; k < pairs.length; k++){
                    if(t != k){
                        p_svg.select("#curve_" + k).style("stroke", "rgb(200,200,200)").style("stroke-width", 1).style("display", "none");//.style("opacity", 0.1);
                        p_svg.select("#line_pair" + k).style("stroke", "rgb(200,200,200)").style("display", "none");
                        p_svg.select("#circle_" + k + "_1").style("stroke", "rgb(200,200,200)").style("display", "none");
                        p_svg.select("#circle_" + k + "_2").style("stroke", "rgb(200,200,200)").style("display", "none");
                    }
                    else{
                        var pp1 = pairs[k]['pair'].substring(0, pairs[k]['pair'].indexOf("+")), 
                            pp2 = pairs[k]['pair'].substring(pairs[k]['pair'].indexOf("+") + 1, pairs[k]['pair'].length);
                        p_svg.select("#curve_" + k).style("stroke", combineColor(pp1,pp2)).style("stroke-width", "2").style("display", "block");
                        p_svg.select("#line_pair" + k).style("stroke", combineColor(pp1,pp2)).style("display", "block");
                        p_svg.select("#circle_" + k + "_1").style("stroke", color(pp1)).style("display", "block");
                        p_svg.select("#circle_" + k + "_2").style("stroke", color(pp2)).style("display", "block");
                        yScale.domain([0.1, d3.max(pairs[k]['emails'])]);
                        p_svg.select(".y.axis")
                            .transition().duration(1000)
                            .call(yAxis);
                        var data = [];
                        for(var r = start_index; r < pairs[0]['time'].length; r++) data.push({time: new Date(pairs[k]['time'][r]), emails: pairs[k]['emails'][r]});
                        p_svg.select("#curve_" + k).transition().duration(1000).attr("d", valueline(data));
                        p_svg.select("#line_pair" + k).transition().duration(1000).attr("y1", yScale(pairs[k]['emails'][pairs[k]['emails'].length-1])).attr("y2", yScale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
                        p_svg.select("#circle_" + k + "_1").transition().duration(1000).attr("cy", yScale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
                        p_svg.select("#circle_" + k + "_2").transition().duration(1000).attr("cy", yScale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
                    }
                }
            }
        }
    }
    function p2Change(){
        var value = this.value;
        pair_p2 = value;
        pair_p1 = document.getElementById("p1Select").value;

        var current_yscale = yScale, current_line = valueline;
        if(current_pair_scale == "linear"){
            current_yscale = yScale_linear; 
            current_line = valueline_linear;
        }
        if(demo == 1){
            for(var name in demo_people_names_match){
                if(pair_p1 != "All" && demo_people_names_match[name] == pair_p1){
                    pair_p1 = name; 
                }
                if(pair_p2 != "All" && demo_people_names_match[name] == pair_p2){
                    pair_p2 = name; value = name;
                }
            }
        }
        if(value == "All" && pair_p1 == "All"){
            //same as restore
            for(var k = 0; k < pairs.length; k++){
                var pp1 = pairs[k]['pair'].substring(0, pairs[k]['pair'].indexOf("+")), 
                    pp2 = pairs[k]['pair'].substring(pairs[k]['pair'].indexOf("+") + 1, pairs[k]['pair'].length);
                p_svg.select("#curve_" + k).style("stroke", combineColor(pp1,pp2)).style("stroke-width", "2").style("display", "block");
                p_svg.select("#line_pair" + k).style("stroke", combineColor(pp1,pp2)).style("display", "block");
                p_svg.select("#circle_" + k + "_1").style("stroke", color(pp1)).style("display", "block");
                p_svg.select("#circle_" + k + "_2").style("stroke", color(pp2)).style("display", "block");
            }
            yScale.domain([0.1, d3.max(pairs, function(d) { return d3.max(d['emails']); })]);
            p_svg.select(".y.axis")
                .transition().duration(1000)
                .call(yAxis);
            for(var k = 0; k < pairs.length; k++){
                var data = [];
                for(var r = start_index; r < pairs[0]['time'].length; r++) data.push({time: new Date(pairs[k]['time'][r]), emails: pairs[k]['emails'][r]});
                p_svg.select("#curve_" + k).transition().duration(1000).attr("d", curent_line(data));
                p_svg.select("#line_pair" + k).transition().duration(1000).attr("y1", current_yscale(pairs[k]['emails'][pairs[k]['emails'].length-1])).attr("y2", current_yscale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
                p_svg.select("#circle_" + k + "_1").transition().duration(1000).attr("cy", current_yscale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
                p_svg.select("#circle_" + k + "_2").transition().duration(1000).attr("cy", current_yscale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
            }
        }
        else if((value == "All" && pair_p1 != "All") || (value != "All" && pair_p1 == "All")){
            //see all related to one member
            var max = 0;
            var p1 = (value == "All"? pair_p1:pair_p2);
            // if(demo == 1){
            //     for(var name in demo_people_names_match){
            //         if(demo_people_names_match[name] == p1){
            //             p1 = name; break;
            //         }
            //     }
            // }
            for(var k = 0; k < pairs.length; k++){
                if(pairs[k]['pair'].indexOf(p1) == -1){
                    p_svg.select("#curve_" + k).style("stroke", "rgb(200,200,200)").style("stroke-width", 1).style("display", "none");
                    p_svg.select("#line_pair" + k).style("stroke", "rgb(200,200,200)").style("display", "none");
                    p_svg.select("#circle_" + k + "_1").style("stroke", "rgb(200,200,200)").style("display", "none");
                    p_svg.select("#circle_" + k + "_2").style("stroke", "rgb(200,200,200)").style("display", "none");
                }
                else{
                    if(d3.max(pairs[k]['emails']) > max) max = d3.max(pairs[k]['emails']);
                    var pp1 = pairs[k]['pair'].substring(0, pairs[k]['pair'].indexOf("+")), 
                        pp2 = pairs[k]['pair'].substring(pairs[k]['pair'].indexOf("+") + 1, pairs[k]['pair'].length);
                    p_svg.select("#curve_" + k).style("stroke", combineColor(pp1,pp2)).style("stroke-width", "2").style("display", "block");
                    p_svg.select("#line_pair" + k).style("stroke", combineColor(pp1,pp2)).style("display", "block");
                    p_svg.select("#circle_" + k + "_1").style("stroke", color(pp1)).style("display", "block");
                    p_svg.select("#circle_" + k + "_2").style("stroke", color(pp2)).style("display", "block");
                }
            }
            yScale.domain([0.1, max]);
            p_svg.select(".y.axis")
                .transition().duration(1000)
                .call(yAxis);
            for(var k = 0; k < pairs.length; k++){
                var data = [];
                for(var r = start_index; r < pairs[0]['time'].length; r++) data.push({time: new Date(pairs[k]['time'][r]), emails: pairs[k]['emails'][r]});
                p_svg.select("#curve_" + k).transition().duration(1000).attr("d", valueline(data));
                p_svg.select("#line_pair" + k).transition().duration(1000).attr("y1", yScale(pairs[k]['emails'][pairs[k]['emails'].length-1])).attr("y2", yScale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
                p_svg.select("#circle_" + k + "_1").transition().duration(1000).attr("cy", yScale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
                p_svg.select("#circle_" + k + "_2").transition().duration(1000).attr("cy", yScale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
            }
        }
        else{
            //see only this pair
            // if(demo == 1){
            //     for(var name in demo_people_names_match){
            //         if(demo_people_names_match[name] == pair_p1){
            //             pair_p1 = name; 
            //         }
            //         if(demo_people_names_match[name] == pair_p2){
            //             pair_p2 = name; 
            //         }
            //     }
            // }
            if(pair_p1 == pair_p2){
                p_svg.selectAll(".line").style("stroke", "rgb(200,200,200)").style("stroke-width", 1).style("display", "none");//.style("opacity", 0.1);
                p_svg.selectAll(".line").style("stroke", "rgb(200,200,200)").style("display", "none");
                // p_svg.select("#circle_" + k + "_1").style("stroke", "rgb(200,200,200)").style("display", "none");
                // p_svg.select("#circle_" + k + "_2").style("stroke", "rgb(200,200,200)").style("display", "none");
            }
            else{
                var t = -1;
                for(var k = 0; k < pairs.length; k++){
                    if(pairs[k]['pair'].indexOf(pair_p1) != -1 && pairs[k]['pair'].indexOf(pair_p2) != -1) t = k;
                }
                 
                for(var k = 0; k < pairs.length; k++){
                    if(t != k){
                        p_svg.select("#curve_" + k).style("stroke", "rgb(200,200,200)").style("stroke-width", 1).style("display", "none");//.style("opacity", 0.1);
                        p_svg.select("#line_pair" + k).style("stroke", "rgb(200,200,200)").style("display", "none");
                        p_svg.select("#circle_" + k + "_1").style("stroke", "rgb(200,200,200)").style("display", "none");
                        p_svg.select("#circle_" + k + "_2").style("stroke", "rgb(200,200,200)").style("display", "none");
                    }
                    else{
                        var pp1 = pairs[k]['pair'].substring(0, pairs[k]['pair'].indexOf("+")), 
                            pp2 = pairs[k]['pair'].substring(pairs[k]['pair'].indexOf("+") + 1, pairs[k]['pair'].length);
                        p_svg.select("#curve_" + k).style("stroke", combineColor(pp1,pp2)).style("stroke-width", "2").style("display", "block");
                        p_svg.select("#line_pair" + k).style("stroke", combineColor(pp1,pp2)).style("display", "block");
                        p_svg.select("#circle_" + k + "_1").style("stroke", color(pp1)).style("display", "block");
                        p_svg.select("#circle_" + k + "_2").style("stroke", color(pp2)).style("display", "block");
                        yScale.domain([0.1, d3.max(pairs[k]['emails'])]);
                        p_svg.select(".y.axis")
                            .transition().duration(1000)
                            .call(yAxis);
                        var data = [];
                        for(var r = start_index; r < pairs[0]['time'].length; r++) data.push({time: new Date(pairs[k]['time'][r]), emails: pairs[k]['emails'][r]});
                        p_svg.select("#curve_" + k).transition().duration(1000).attr("d", valueline(data));
                        p_svg.select("#line_pair" + k).transition().duration(1000).attr("y1", yScale(pairs[k]['emails'][pairs[k]['emails'].length-1])).attr("y2", yScale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
                        p_svg.select("#circle_" + k + "_1").transition().duration(1000).attr("cy", yScale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
                        p_svg.select("#circle_" + k + "_2").transition().duration(1000).attr("cy", yScale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
                    }
                }
            }
        }
    }
    
    var p_margin = {top: 70, right: -60, bottom: 100, left: 90};
    var svg_width = $(window).width() * 0.8, svg_height = $(window).height() * 0.8;
    var p_width = svg_width - p_margin.left - p_margin.right, p_height = svg_height - p_margin.top - p_margin.bottom;
    d3.select("#restore_button")//.style("left", p_width + "px").style("top", "0px")
      .on("click", function(){
        current_pair_scale = "log";
        d3.select("#pairs_time_scale").select("#pairs_time_linear").style("background-color", "rgba(184,184,184,0)");
        d3.select("#pairs_time_scale").select("#pairs_time_log").style("background-color", "rgba(184,184,184,1)");

        pair_p1 = "All"; pair_p2 = "All";
        document.getElementById("p1Select").value = pair_p1;
        document.getElementById("p2Select").value = pair_p2;
        yScale.domain([0.1, d3.max(pairs, function(d) { return d3.max(d['emails']); })]);
        xScale.domain([new Date(xAxis_start), new Date(d3.extent(pairs[0]['time'])[1])]);
        yAxis.scale(yScale);
        p_svg.select(".x.axis")
                .transition().duration(1000)
                .call(xAxis);
        p_svg.select(".y.axis")
            .transition().duration(1000)
            .call(yAxis);
        d3.select("#analysis_pairs_cover").selectAll("rect.extent").attr("width", 0);
        for(var k = 0; k < pairs.length; k++){
            var data = [];
            for(var r = start_index; r < pairs[0]['time'].length; r++) data.push({time: new Date(pairs[k]['time'][r]), emails: pairs[k]['emails'][r]});
            p_svg.select("#curve_" + k).transition().duration(1000).attr("d", valueline(data));
            p_svg.select("#line_pair" + k).transition().duration(1000).attr("y1", yScale(pairs[k]['emails'][pairs[k]['emails'].length-1])).attr("y2", yScale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
            p_svg.select("#circle_" + k + "_1").transition().duration(1000).attr("cy", yScale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
            p_svg.select("#circle_" + k + "_2").transition().duration(1000).attr("cy", yScale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
        }
        d3.range(pairs[0]['time'].length - start_index - 2).forEach(function(l){
            p_svg.select("#line_" + l).transition().duration(500).attr("x1", xScale(new Date(pairs[0]['time'][pairs[0]['time'].length - l - 2])))
             .attr("x2", xScale(new Date(pairs[0]['time'][pairs[0]['time'].length - l - 2]))).attr("y2", p_height)       
             .style("stroke", "rgba(255,255,255,0.4)").style("stroke-dasharray", ("4, 4"));
        });   
        setTimeout(function(){
            for(var k = 0; k < pairs.length; k++){
                var pp1 = pairs[k]['pair'].substring(0, pairs[k]['pair'].indexOf("+")), 
                    pp2 = pairs[k]['pair'].substring(pairs[k]['pair'].indexOf("+") + 1, pairs[k]['pair'].length);
                p_svg.select("#curve_" + k).style("stroke", combineColor(pp1,pp2)).style("stroke-width", "2").style("display", "block");
                p_svg.select("#line_pair" + k).style("stroke", combineColor(pp1,pp2)).style("display", "block");
                p_svg.select("#circle_" + k + "_1").style("stroke", color(pp1)).style("display", "block");
                p_svg.select("#circle_" + k + "_2").style("stroke", color(pp2)).style("display", "block");
            }
        }, 1000);
    });

    d3.select("#analysis_pairs_cover").select("svg").selectAll("*").remove();
    d3.select("#analysis_pairs_cover").style("display", "none");
    var p_svg = d3.select("#analysis_pairs_svg")
        .attr("width", p_width + p_margin.left + p_margin.right).attr("height", p_height + p_margin.top + p_margin.bottom)
        .append("g").attr("transform", "translate(" + p_margin.left + "," + p_margin.top + ")");
    
    var customTimeFormat = d3.time.format.multi([
      [".%L", function(d) { return d.getMilliseconds(); }],
      [":%S", function(d) { return d.getSeconds(); }],
      ["%I:%M", function(d) { return d.getMinutes(); }],
      ["%I %p", function(d) { return d.getHours(); }],
      ["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
      ["%b %d", function(d) { return d.getDate() != 1; }],
      ["%B", function(d) { return d.getMonth(); }],
      ["%Y", function() { return true; }]
    ]);
    var formatNumber = d3.format(",.1f");

    var current_pair_scale = "log";
    var xScale = d3.time.scale().range([0, p_width-100]), // value -> display
        xAxis = d3.svg.axis().scale(xScale).orient("bottom")
            .tickFormat(customTimeFormat)
            .ticks(d3.timeMonth.every(6));

    // setup y
    var yScale = d3.scale.log().base(10).range([p_height, 0]),
        yScale_linear = d3.scale.linear().range([p_height, 0]),
        yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(6, function(d) { return formatNumber(d) });

    // var p_svg = d3.select("#analysis_pairs_svg")
    //     .style("width", p_width + p_margin.left + p_margin.right + "px").style("height", p_height + p_margin.top + p_margin.bottom + "px");

    var xAxis_start = pairs[0]['time'][pairs[0]['time'].length-1], start_index = pairs[0]['time'].length-1; 
    for(var i = 0; i < pairs.length; i++){
        for(var j = 1; j < pairs[i]['time'].length; j++){
            if(pairs[i]['emails'][j] != 0 && pairs[i]['time'][j-1] < xAxis_start){ 
                xAxis_start = pairs[i]['time'][j-1]; 
                start_index = j-1; break;
            }
        }
    }

    var data_all = [];
    for(var t = 0; t < pairs.length; t++){
        for(var r = start_index; r < pairs[0]['time'].length; r++){
            var mean = Math.sqrt((Math.pow(pairs[t]['emails_to'][r], 2) + Math.pow(pairs[t]['emails_from'][r], 2)) / 2); //quardratic mean
            var p1 = pairs[t]['pair'].substring(0, pairs[t]['pair'].indexOf("+")), 
                p2 = pairs[t]['pair'].substring(pairs[t]['pair'].indexOf("+") + 1, pairs[t]['pair'].length);
            var the_pair = p1 + " & " + p2;
            data_all.push({pair: the_pair, time: new Date(pairs[t]['time'][r]), emails: mean});
        }
    }

    // var visualization = d3plus.viz()
    //     .container("#analysis_pairs_svg")  
    //     .data(data_all)  
    //     .type("line")       
    //     .id("pair")         
    //     .text("name")       
    //     .y("emails") 
    //     .x("time")
    //     .background("#2f3140")
    //     .axes({"background": {"color": "#2f3140"}})
    //     .y({"scale": "linear", "ticks": 5})
    //     // .shape({
    //     //   "interpolate": "basis"  // takes accepted values to change interpolation type
    //     // })
    //     .draw();
    // xAxis.ticks(pairs[0]['time'].length - start_index + 2);
    xScale.domain([new Date(xAxis_start), new Date(d3.extent(pairs[0]['time'])[1])]);
    yScale.domain([0.1, d3.max(pairs, function(d) { return d3.max(d['emails']); })]);
    yScale_linear.domain([0, d3.max(pairs, function(d) { return d3.max(d['emails']); })]);
    var bisectDate = d3.bisector(function(d) { return d['time']; }).left;
    var	valueline = d3.svg.line().interpolate("monotone")
    	.x(function(d) { return xScale(d['time']); })
    	.y(function(d) { return yScale(d['emails']<=0.1?0.1:d['emails']); }),
        valueline_linear = d3.svg.line().interpolate("monotone")
        .x(function(d) { return xScale(d['time']); })
        .y(function(d) { return yScale_linear(d['emails']<=0?0:d['emails']); });
    p_svg.append("g") //x-axis
        .attr("class", "x axis")
        .attr("transform", "translate(0," + p_height + ")")
        .call(xAxis)
      .append("text")
        .attr("class", "x_label")
        .attr("x", p_width)
        .attr("y", -6)
        .style("text-anchor", "end");
    p_svg.append("g") //y-axis
        .attr("class", "y axis")
        .attr("transform", "translate(" + 0 + ", 0)")
        .call(yAxis)
      .append("text")
        .attr("class", "y_label")
        // .attr("transform", "rotate(-90)")
        .attr("transform", "translate(0, " + p_height/2 +") rotate(-90)")
        .attr("y", -70)
        .attr("dy", ".71em")
        .style("text-anchor", "middle")
        .text("Mean of Sent and Rcv");
        // .text("Quadratic mean of Sent and Rcv");


    var end_year = new Date(d3.extent(pairs[0]['time'])[1]), start_year = new Date(xAxis_start);
    end_year = end_year.getFullYear(); start_year = start_year.getFullYear();
    var the_width = ((end_year - start_year + 1) > 10? 420 : (end_year - start_year + 1) * 42),
        each_width = ((end_year - start_year + 1) > 10? 420 / (end_year - start_year + 1) : 42);
    var timeline_margin = {top: 1, right: 0, bottom: 0, left: 40},
        timeline_width = the_width,
        timeline_height = 40 - timeline_margin.top - timeline_margin.bottom;
    var timeline_x = d3.time.scale().range([0, timeline_width])
        .domain([new Date(start_year, 0, 1), new Date(end_year, 11, 31)]).nice(); //[new Date(start_year, 1, 1), new Date(end_year, 12, 31)] //xAxis_start
    var timeline_svg = d3.select("#timeline_svg")
        .attr("width", timeline_width + timeline_margin.left + timeline_margin.right)
        .attr("height", timeline_height + timeline_margin.top + timeline_margin.bottom)
        .style("margin-left", "600px")
      .append("g")
        .attr("transform", "translate(" + timeline_margin.left + "," + timeline_margin.top + ")");
    timeline_svg.append("rect").attr("x", 0.5).attr("y", 0.5)
        .attr("width", timeline_width - 1.5).attr("height", 25.5)
        .attr("stroke", "#fff").attr("fill", "rgba(0,0,0,0)");
    var timeline_brush = d3.svg.brush()
        .x(timeline_x)
        .on("brush", timeline_brushed)
        .on("brushend", timeline_brushedend);

    var formatNumber2 = d3.format(",.3f");
    var timeline_xAxis= d3.svg.axis().tickSize(26).outerTickSize(0)
        .scale(timeline_x).ticks(d3.time.years, 1)
        .orient("bottom");
    var mini_x = timeline_svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + 0 + ")")
        .call(timeline_xAxis);
    mini_x.selectAll("text")
        .attr("x", each_width / 2 - 15).attr("y", 19)
        .attr("dy", null)
        .style("text-anchor", null);
    function timeline_brushed(){
        var new_end_year = end_year, new_start_year = start_year;
        var current_yscale = yScale, current_line = valueline;
        if(current_pair_scale == "linear"){
            current_yscale = yScale_linear; 
            current_line = valueline_linear;
        }

        if(!timeline_brush.empty()){
            new_end_year = timeline_brush.extent()[1].getFullYear(); new_start_year = timeline_brush.extent()[0].getFullYear();
            // timeline_brush.extent([new Date(new_start_year, 1,1), new Date(new_end_year, 12, 31)]);
            // timeline_svg.select("g.timeline_brush").call(timeline_brush);
            // d3.select("#analysis_pairs_cover").select("rect.extent").attr("x", timeline_x(new Date(new_start_year, 1,1))).attr("width", timeline_x(new Date(new_end_year, 12, 31)) - timeline_x(new Date(new_start_year, 1,1)));
        }
        p_svg.select(".x.axis").transition().duration(500).call(xAxis);

        if(!timeline_brush.empty()){
            xScale.domain(timeline_brush.extent());
            xAxis.scale(xScale);
            p_svg.select(".x.axis")
                .transition().duration(500)
                .call(xAxis);
            yScale.domain([0.1, d3.max(pairs, function(d){return d3.max(d['emails']);})]);
            p_svg.select(".y.axis")
                .transition().duration(500)
                .call(yAxis);
            for(var k = 0; k < pairs.length; k++){
                var data = [];
                for(var r = start_index; r < pairs[0]['time'].length; r++) data.push({time: new Date(pairs[k]['time'][r]), emails: pairs[k]['emails'][r]});
                p_svg.select("#curve_" + k).transition().duration(500).attr("d", current_line(data));
                p_svg.select("#line_pair" + k).transition().duration(500).attr("y1", current_yscale(pairs[k]['emails'][pairs[k]['emails'].length-1])).attr("y2", current_yscale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
                p_svg.select("#circle_" + k + "_1").transition().duration(500).attr("cy", current_yscale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
                p_svg.select("#circle_" + k + "_2").transition().duration(500).attr("cy", current_yscale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
            }
            d3.range(pairs[0]['time'].length - start_index - 2).forEach(function(l){
                p_svg.select("#line_" + l).transition().duration(500).attr("x1", xScale(new Date(pairs[0]['time'][pairs[0]['time'].length - l - 2])))
                 .attr("x2", xScale(new Date(pairs[0]['time'][pairs[0]['time'].length - l - 2]))).attr("y2", p_height)       
                 .style("stroke", "rgba(255,255,255,0.4)").style("stroke-dasharray", ("4, 4"));
            });  
        }
        else{
            xScale.domain([new Date(xAxis_start), new Date(d3.extent(pairs[0]['time'])[1])]);
            xAxis.scale(xScale);
            p_svg.select(".x.axis")
                .transition().duration(1000)
                .call(xAxis);
            yScale.domain([0.1, d3.max(pairs, function(d){return d3.max(d['emails']);})]);
            p_svg.select(".y.axis")
                .transition().duration(1000)
                .call(yAxis);
            for(var k = 0; k < pairs.length; k++){
                var data = [];
                for(var r = start_index; r < pairs[0]['time'].length; r++) data.push({time: new Date(pairs[k]['time'][r]), emails: pairs[k]['emails'][r]});
                p_svg.select("#curve_" + k).transition().duration(1000).attr("d", current_line(data));
                p_svg.select("#line_pair" + k).transition().duration(1000).attr("y1", current_yscale(pairs[k]['emails'][pairs[k]['emails'].length-1])).attr("y2", current_yscale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
                p_svg.select("#circle_" + k + "_1").transition().duration(1000).attr("cy", current_yscale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
                p_svg.select("#circle_" + k + "_2").transition().duration(1000).attr("cy", current_yscale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
            } 
            d3.range(pairs[0]['time'].length - start_index - 2).forEach(function(l){
                p_svg.select("#line_" + l).transition().duration(500).attr("x1", xScale(new Date(pairs[0]['time'][pairs[0]['time'].length - l - 2])))
                 .attr("x2", xScale(new Date(pairs[0]['time'][pairs[0]['time'].length - l - 2]))).attr("y2", p_height)       
                 .style("stroke", "rgba(255,255,255,0.4)").style("stroke-dasharray", ("4, 4"));
            });   
        }
    }
    function timeline_brushedend(){
        var new_end_year = end_year, new_start_year = start_year;
        var new_end_month, new_start_month;

        var current_yscale = yScale, current_line = valueline;
        if(current_pair_scale == "linear"){
            current_yscale = yScale_linear; 
            current_line = valueline_linear;
        }

        if(!timeline_brush.empty()){
            new_end_year = timeline_brush.extent()[1].getFullYear(); new_start_year = timeline_brush.extent()[0].getFullYear();
            new_end_month = timeline_brush.extent()[1].getMonth(); new_start_month = timeline_brush.extent()[0].getMonth();
            timeline_brush.extent([(new_start_month<6? new Date(new_start_year, 0,1):new Date(new_start_year+1, 0,1)), (new_end_month<6? new Date(new_end_year-1, 11, 31):new Date(new_end_year, 11, 31))]);
            timeline_svg.select("g.timeline_brush").call(timeline_brush);
            // d3.select("#analysis_pairs_cover").select("rect.extent").transition().duration(500).attr("x", timeline_x(new Date(new_start_year, 1,1)) - 4).attr("width", timeline_x(new Date(new_end_year, 12, 31)) - timeline_x(new Date(new_start_year, 1,1)));

            p_svg.select(".x.axis").transition().duration(500).call(xAxis);
        
            xScale.domain(timeline_brush.extent());
            xAxis.scale(xScale);
            p_svg.select(".x.axis")
                .transition().duration(500)
                .call(xAxis);
            yScale.domain([0.1, d3.max(pairs, function(d){return d3.max(d['emails']);})]);
            p_svg.select(".y.axis")
                .transition().duration(500)
                .call(yAxis);
            for(var k = 0; k < pairs.length; k++){
                var data = [];
                for(var r = start_index; r < pairs[0]['time'].length; r++) data.push({time: new Date(pairs[k]['time'][r]), emails: pairs[k]['emails'][r]});
                p_svg.select("#curve_" + k).transition().duration(500).attr("d", current_line(data));
                p_svg.select("#line_pair" + k).transition().duration(500).attr("y1", current_yscale(pairs[k]['emails'][pairs[k]['emails'].length-1])).attr("y2", current_yscale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
                p_svg.select("#circle_" + k + "_1").transition().duration(500).attr("cy", current_yscale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
                p_svg.select("#circle_" + k + "_2").transition().duration(500).attr("cy", current_yscale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
            }  
            d3.range(pairs[0]['time'].length - start_index - 2).forEach(function(l){
                p_svg.select("#line_" + l).transition().duration(500).attr("x1", xScale(new Date(pairs[0]['time'][pairs[0]['time'].length - l - 2])))
                 .attr("x2", xScale(new Date(pairs[0]['time'][pairs[0]['time'].length - l - 2]))).attr("y2", p_height)       
                 .style("stroke", "rgba(255,255,255,0.4)").style("stroke-dasharray", ("4, 4"));
            });      
        }
    }
    var brush_x_grab = timeline_svg.append("g")
            .attr("class", "timeline_brush")
            .attr("transform", "translate(-0, -" + 0 + ")")
            .call(timeline_brush);
    brush_x_grab.selectAll("rect").attr("height", 26);

    d3.select("#pairs_time_scale").select("#pairs_time_linear").on("click", function(){
        current_pair_scale = "linear";
        d3.select("#pairs_time_scale").select("#pairs_time_log").style("background-color", "rgba(184,184,184,0)");
        d3.select("#pairs_time_scale").select("#pairs_time_linear").style("background-color", "rgba(184,184,184,1)");

        yAxis.scale(yScale_linear);
        p_svg.select(".y.axis").transition().duration(500).call(yAxis);

        for(var k = 0; k < pairs.length; k++){
            var data = [];
            for(var r = start_index; r < pairs[0]['time'].length; r++) data.push({time: new Date(pairs[k]['time'][r]), emails: pairs[k]['emails'][r]});
            p_svg.select("#curve_" + k).transition().duration(500).attr("d", valueline_linear(data));
            p_svg.select("#line_pair" + k).transition().duration(500).attr("y1", yScale_linear(pairs[k]['emails'][pairs[k]['emails'].length-1])).attr("y2", yScale_linear(pairs[k]['emails'][pairs[k]['emails'].length-1]));
            p_svg.select("#circle_" + k + "_1").transition().duration(500).attr("cy", yScale_linear(pairs[k]['emails'][pairs[k]['emails'].length-1]));
            p_svg.select("#circle_" + k + "_2").transition().duration(500).attr("cy", yScale_linear(pairs[k]['emails'][pairs[k]['emails'].length-1]));
        }
    });
    d3.select("#pairs_time_scale").select("#pairs_time_log").on("click", function(){
        current_pair_scale = "log";
        d3.select("#pairs_time_scale").select("#pairs_time_linear").style("background-color", "rgba(184,184,184,0)");
        d3.select("#pairs_time_scale").select("#pairs_time_log").style("background-color", "rgba(184,184,184,1)");

        yAxis.scale(yScale);
        p_svg.select(".y.axis").transition().duration(500).call(yAxis);

        for(var k = 0; k < pairs.length; k++){
            var data = [];
            for(var r = start_index; r < pairs[0]['time'].length; r++) data.push({time: new Date(pairs[k]['time'][r]), emails: pairs[k]['emails'][r]});
            p_svg.select("#curve_" + k).transition().duration(500).attr("d", valueline(data));
            p_svg.select("#line_pair" + k).transition().duration(500).attr("y1", yScale(pairs[k]['emails'][pairs[k]['emails'].length-1])).attr("y2", yScale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
            p_svg.select("#circle_" + k + "_1").transition().duration(500).attr("cy", yScale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
            p_svg.select("#circle_" + k + "_2").transition().duration(500).attr("cy", yScale(pairs[k]['emails'][pairs[k]['emails'].length-1]));
        }
    });

    function addWhite(color){
        var r = 0, g = 0, b = 0;
        var color2 = "#ffffff";
        var ratio1 = 5, ratio2 = 1;
        r = (parseInt(color.substring(1, 3), 16) * ratio1 + parseInt(color2.substring(1, 3), 16) * ratio2) / (ratio1 + ratio2);
        g = (parseInt(color.substring(3, 5), 16) * ratio1 + parseInt(color2.substring(3, 5), 16) * ratio2) / (ratio1 + ratio2);
        b = (parseInt(color.substring(5, 7), 16) * ratio1 + parseInt(color2.substring(5, 7), 16) * ratio2) / (ratio1 + ratio2);        
        // r /= 2; g /= 2; b /= 2; 
        r = Math.round(r); g = Math.round(g); b = Math.round(b);
        r = r.toString(16); g = g.toString(16); b = b.toString(16); 
        return "#" + (r.length == 1 ? "0" + r : r) + (g.length == 1 ? "0" + g : g) + (b.length == 1 ? "0" + b : b);
    }

    function combineColor(name1, name2){
        // return "rgba(200,200,200,0.8)";
        var i1 = usersinfo.findIndex(x => (x.given_name+' '+x.family_name)==name1 || x.name==name1), 
            i2 = usersinfo.findIndex(x => (x.given_name+' '+x.family_name)==name2 || x.name==name2);
        var colors = ["#D82020", "#D83A20", "#D85B20", "#D88520", "#D8AD20", "#E1C320", "#D4D820", "#C2D820", "#90D820", "#5ED820", "#2CD820", "#26CB79", "#20CFD8", "#208ED8", "#2029D8", "#6820D8"];
        // var colors = ["#D82020", "#D85B20", "#D8AD20", "#D4D820", "#90D820", "#2CD820", "#20CFD8", "#208ED8", "#2029D8", "#6820D8"];
        var r = 0, g = 0, b = 0;
        r = parseInt(colors[Math.round(i1 * (colors.length - 1) / (usersinfo.length - 1))].substring(1, 3), 16) + parseInt(colors[Math.round(i2 * (colors.length - 1) / (usersinfo.length - 1))].substring(1, 3), 16);
        g = parseInt(colors[Math.round(i1 * (colors.length - 1) / (usersinfo.length - 1))].substring(3, 5), 16) + parseInt(colors[Math.round(i2 * (colors.length - 1) / (usersinfo.length - 1))].substring(3, 5), 16);
        b = parseInt(colors[Math.round(i1 * (colors.length - 1) / (usersinfo.length - 1))].substring(5, 7), 16) + parseInt(colors[Math.round(i2 * (colors.length - 1) / (usersinfo.length - 1))].substring(5, 7), 16);        
        // r = parseInt(colors[Math.round(i1 * (colors.length - 1) / (usersinfo.length - 1))].substring(1, 3), 16) + parseInt(colors[Math.round(i2 * (colors.length - 1) / (usersinfo.length - 1))].substring(1, 3), 16);
        // g = parseInt(colors[Math.round(i1 * (colors.length - 1) / (usersinfo.length - 1))].substring(3, 5), 16) + parseInt(colors[Math.round(i2 * (colors.length - 1) / (usersinfo.length - 1))].substring(3, 5), 16);
        // b = parseInt(colors[Math.round(i1 * (colors.length - 1) / (usersinfo.length - 1))].substring(5, 7), 16) + parseInt(colors[Math.round(i2 * (colors.length - 1) / (usersinfo.length - 1))].substring(5, 7), 16);
        r /= 2; g /= 2; b /= 2; 
        r = Math.round(r); g = Math.round(g); b = Math.round(b);
        r = r.toString(16); g = g.toString(16); b = b.toString(16); 
        // return "#" + (r.length == 1 ? "0" + r : r) + (g.length == 1 ? "0" + g : g) + (b.length == 1 ? "0" + b : b);
        return addWhite("#" + (r.length == 1 ? "0" + r : r) + (g.length == 1 ? "0" + g : g) + (b.length == 1 ? "0" + b : b));
    }
    var color = function(name){
        var i = usersinfo.findIndex(x => (x.given_name+' '+x.family_name)==name || x.name==name);
        if(usersinfo[i].email == "data.immersion@gmail.com" || usersinfo[i].email == "data.immersion.2016@gmail.com"){
            var colors = ["#D82020", "#D83A20", "#D85B20", "#D88520", "#D8AD20", "#E1C320", "#D4D820", "#C2D820", "#90D820", "#5ED820", "#2CD820", "#26CB79", "#20CFD8", "#208ED8", "#2029D8", "#6820D8"
                          ];
            // return colors[Math.round(i * (colors.length - 1) / (usersinfo.length - 1))];
            return addWhite(colors[Math.round(i * (colors.length - 1) / (usersinfo.length - 1))]);
        }
        else{
            var colors = ["#D82020", "#D83A20", "#D85B20", "#D88520", "#D8AD20", "#E1C320", "#D4D820", "#C2D820", "#90D820", "#5ED820", "#2CD820", "#26CB79", "#20CFD8", "#208ED8", "#2029D8", "#6820D8"];
            // var colors = ["#D82020", "#D85B20", "#D8AD20", "#D4D820", "#90D820", "#2CD820", "#20CFD8", "#208ED8", "#2029D8", "#6820D8"];
            // return colors[Math.round(i * (colors.length - 1) / (usersinfo.length - 1))];
            return addWhite(colors[Math.round(i * (colors.length - 1) / (usersinfo.length - 1))]);
        }
    };
    var clipPath = p_svg.append("defs")
        .append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", p_width - 100)
        .attr("height", p_height);
    p_svg.append("line").attr("id", "moving_axis").attr("y1", 0).attr("y2", p_height)
        .style("stroke", "rgba(255,255,255,1)").style("stroke-dasharray", ("2, 2")).style("stroke-width", 1);
    var x_mark_label = p_svg.append("g").attr("id", "x_mark_label").style("opacity", 0).attr("transform", "translate(0,0)");
    x_mark_label.append("rect").attr("id", "mark_rect")
        .attr("x", -49).attr("y", -14)
        .attr("width", 48).attr("height", 28)
        .attr("fill", "rgb(10,10,10)").attr("stroke", "rgb(80,80,80)");
    x_mark_label.append("text").attr("id", "mark_text")
        .attr("text-anchor", "end").attr("x", -10).attr("y", 0)
        .attr("dy", ".35em");
    var data_all = [];
    var member_names = [];
    for(var kkk = 0; kkk < usersinfo.length; kkk++){
        member_names.push(usersinfo[kkk]['name']);
        member_names.push(usersinfo[kkk]['given_name'] + ' ' + usersinfo[kkk]['family_name']);
    }
    for(var t = 0; t < pairs.length; t++){
        var data = [];
        var p1 = pairs[t]['pair'].substring(0, pairs[t]['pair'].indexOf("+")), 
            p2 = pairs[t]['pair'].substring(pairs[t]['pair'].indexOf("+") + 1, pairs[t]['pair'].length);
        if(member_names.indexOf(p1) != -1 && member_names.indexOf(p2) != -1){
            var is_zero = true;
            for(var r = start_index; r < pairs[0]['time'].length; r++){
                // var mean = Math.sqrt((Math.pow(pairs[t]['emails_to'][r], 2) + Math.pow(pairs[t]['emails_from'][r], 2)) / 2); //quardratic mean
                var mean = (pairs[t]['emails_to'][r] + pairs[t]['emails_from'][r]) / 2; //mean
                data.push({time: new Date(pairs[t]['time'][r]), emails: mean});
            }
            data_all.push(data);
            p_svg.append("path").attr("id", "curve_" + t)
                .attr("clip-path", "url(#clip)")
                .attr("class", "line").style("stroke-width", "2").style("stroke", combineColor(p1,p2))
                .attr("d", valueline(data))
                .on("mouseover", function(){
                    var t = parseInt(d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("curve_") + 6, d3.select(this).attr("id").length));
                    p_svg.selectAll(".line").style("opacity", 0.3).style("stroke-width", "2");
                    d3.select(this).style("opacity", 1).style("stroke-width", "4");
                    p_svg.selectAll(".line_pair").style("opacity", 0.0);
                    p_svg.selectAll(".pair_circle").style("opacity", 0.0);
                    p_svg.select("#line_pair" + t).style("opacity", 1);
                    p_svg.select("#circle_" + t + "_1").style("opacity", 1);
                    p_svg.select("#circle_" + t + "_2").style("opacity", 1);
                    p_svg.selectAll(".focus").style("opacity", 0);
                    p_svg.select("#focus_" + t).style("opacity", 1).select("#x_mark").style("opacity", 1);

                    var transform_y = d3.transform(p_svg.select("#focus_" + t).attr("transform")).translate[1];
                    x_mark_label.attr("transform", "translate(" + 0 + "," + transform_y + ")").style("opacity", 1);
                    
                    var current_yscale = yScale;
                    if(current_pair_scale == "linear") current_yscale = yScale_linear;
                    var y0 = (current_yscale.invert(transform_y)).toFixed(1);
                    x_mark_label.select("#mark_text").text(y0);
                })
                .on("mouseout", function(){
                    p_svg.selectAll(".line").style("opacity", 1).style("stroke-width", "2");
                    p_svg.selectAll(".line_pair").style("opacity", 1);
                    p_svg.selectAll(".pair_circle").style("opacity", 1);
                    p_svg.selectAll(".focus").style("opacity", 1);

                    p_svg.selectAll("#x_mark").style("opacity", 0);
                    x_mark_label.style("opacity", 0);
                });
        }
    }
    d3.range(pairs[0]['time'].length - start_index - 2).forEach(function(l){
        p_svg.append("line").attr("clip-path", "url(#clip)")
         .attr("id", "line_" + l).attr("x1", xScale(new Date(pairs[0]['time'][pairs[0]['time'].length - l - 2]))).attr("y1", 0)
         .attr("x2", xScale(new Date(pairs[0]['time'][pairs[0]['time'].length - l - 2]))).attr("y2", p_height)       
         .style("stroke", "rgba(255,255,255,0.4)").style("stroke-dasharray", ("4, 4"))     
         .style("stroke-width", 1);
    });
    for(var ii = 0; ii < pairs.length; ii++){
        var focus = p_svg.append("g").attr("id", "focus_" + ii)
          // .attr("clip-path", "url(#clip)")
          .attr("class", "focus")
          .style("display", "none")
          .on("mouseover", function(){
              var t = parseInt(d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("focus_") + 6, d3.select(this).attr("id").length));
              p_svg.selectAll(".line").style("opacity", 0.3).style("stroke-width", "2");
              p_svg.select("#curve_" + t).style("opacity", 1).style("stroke-width", "4");
              p_svg.selectAll(".line_pair").style("opacity", 0.0);
              p_svg.selectAll(".pair_circle").style("opacity", 0.0);
              p_svg.select("#line_pair" + t).style("opacity", 1);
              p_svg.select("#circle_" + t + "_1").style("opacity", 1);
              p_svg.select("#circle_" + t + "_2").style("opacity", 1);
              p_svg.selectAll(".focus").style("opacity", 0);
              p_svg.select("#focus_" + t).style("opacity", 1).select("#x_mark").style("opacity", 1);

              var transform_y = d3.transform(p_svg.select("#focus_" + t).attr("transform")).translate[1];
              x_mark_label.attr("transform", "translate(" + 0 + "," + transform_y + ")").style("opacity", 1);
              
              var current_yscale = yScale;
              if(current_pair_scale == "linear") current_yscale = yScale_linear;
              var y0 = (current_yscale.invert(transform_y)).toFixed(1);
              x_mark_label.select("#mark_text").text(y0);
          })
          .on("mouseout", function(){
              p_svg.selectAll(".line").style("opacity", 1).style("stroke-width", "2");
              p_svg.selectAll(".line_pair").style("opacity", 1);
              p_svg.selectAll(".pair_circle").style("opacity", 1);
              p_svg.selectAll(".focus").style("opacity", 1);

              p_svg.selectAll("#x_mark").style("opacity", 0);
              x_mark_label.style("opacity", 0);
          });
        focus.append("rect").attr("x", -70).attr("y", -28)
            .attr("width", 140).attr("height", 26)
            .attr("fill", "rgb(10,10,10)").attr("stroke", "rgb(80,80,80)");
        focus.append("circle")
            .attr("r", 3.5).attr("fill", "rgb(250,250,250)");
        focus.append("text").attr("id", "text_1")
            .attr("text-anchor", "end").attr("x", 5).attr("y", -15)
            .attr("dy", ".35em");
        focus.append("text").attr("id", "text_2")
            .attr("text-anchor", "start").attr("x", 7).attr("y", -15)
            .attr("dy", ".35em");
        focus.append("line").attr("id", "x_mark")
            .attr("x1", -2000).attr("y1", 0).attr("x2", 0).attr("y2", 0)
            .style("stroke", "rgba(255,255,255,1)").style("stroke-dasharray", ("2, 2")).style("stroke-width", 1)
            .style("opacity", 0);
    }
    d3.select("#analysis_pairs_svg").on("mousemove", function(){
        var x = d3.mouse(this)[0];
        var current_yscale = yScale;
        if(current_pair_scale == "linear") current_yscale = yScale_linear;
        if(x > 80 && x < p_width - 20){
            p_svg.select("#moving_axis").attr("x1", x-80)
              .attr("x2", x-80).style("display", "block");
            var x0 = xScale.invert(d3.mouse(this)[0]-80),
                i = bisectDate(data, x0, 1);
            if(i < data_all[0].length){
                for(var k = 0; k < pairs.length; k++){
                    var d0 = data_all[k][i - 1],
                    d1 = data_all[k][i],
                    d = x0 - d0['time'] > d1['time'] - x0 ? d1 : d0;
                    var p1 = pairs[k]['pair'].substring(0, pairs[k]['pair'].indexOf("+")), 
                        p2 = pairs[k]['pair'].substring(pairs[k]['pair'].indexOf("+") + 1, pairs[k]['pair'].length);
                    var focus = p_svg.select("#focus_" + k);
                    focus.attr("transform", "translate(" + xScale(d['time']) + "," + current_yscale(d['emails']) + ")").style("display", "block");
                    if(d['emails'] != 0){
                        if(pair_p1 == "All" && pair_p2 == "All"){
                            focus.select("circle").style("opacity", 1);
                            focus.select("rect").style("opacity", 1);
                            focus.select("rect").attr("x", -1 * ((demo == 1? demo_people_names_match[p1]:p1.substring(0, p1.indexOf(" "))).length * 10.5) - 5).attr("width", ((((demo == 1? demo_people_names_match[p1]:p1.substring(0, p1.indexOf(" "))).length + (demo == 1? demo_people_names_match[p2]:p2.substring(0, p2.indexOf(" "))).length) * 10.5) + 10));
                            focus.select("#text_1").text((demo == 1? demo_people_names_match[p1]:p1.substring(0, p1.indexOf(" "))) + " & ");
                            focus.select("#text_2").text((demo == 1? demo_people_names_match[p2]:p2.substring(0, p2.indexOf(" "))));
                            focus.select("#x_mark").attr("x1", -xScale(d['time']));
                        }
                        else if(pair_p2 == "All" && (pair_p1 == p1 || pair_p1 == p2)){
                            focus.select("circle").style("opacity", 1);
                            focus.select("rect").style("opacity", 1);
                            focus.select("rect").attr("x", -1 * ((demo == 1? demo_people_names_match[p1]:p1.substring(0, p1.indexOf(" "))).length * 10.5) - 5).attr("width", ((((demo == 1? demo_people_names_match[p1]:p1.substring(0, p1.indexOf(" "))).length + (demo == 1? demo_people_names_match[p2]:p2.substring(0, p2.indexOf(" "))).length) * 10.5) + 10));
                            focus.select("#text_1").text((demo == 1? demo_people_names_match[p1]:p1.substring(0, p1.indexOf(" ")) + " & "));
                            focus.select("#text_2").text((demo == 1? demo_people_names_match[p2]:p2.substring(0, p2.indexOf(" "))));
                            focus.select("#x_mark").attr("x1", -xScale(d['time']));
                        }
                        else if(pair_p1 == "All" && (pair_p2 == p1 || pair_p2 == p2)){
                            focus.select("circle").style("opacity", 1);
                            focus.select("rect").style("opacity", 1);
                            focus.select("rect").attr("x", -1 * ((demo == 1? demo_people_names_match[p1]:p1.substring(0, p1.indexOf(" "))).length * 10.5) - 5).attr("width", ((((demo == 1? demo_people_names_match[p1]:p1.substring(0, p1.indexOf(" "))).length + (demo == 1? demo_people_names_match[p2]:p2.substring(0, p2.indexOf(" "))).length) * 10.5) + 10));
                            focus.select("#text_1").text((demo == 1? demo_people_names_match[p1]:p1.substring(0, p1.indexOf(" ")) + " & "));
                            focus.select("#text_2").text((demo == 1? demo_people_names_match[p2]:p2.substring(0, p2.indexOf(" "))));
                            focus.select("#x_mark").attr("x1", -xScale(d['time']));
                        }
                        else if((pair_p1 == p1 && pair_p2 == p2) || (pair_p1 == p2 && pair_p2 == p1)){
                            focus.select("circle").style("opacity", 1);
                            focus.select("rect").style("opacity", 1);
                            focus.select("rect").attr("x", -1 * ((demo == 1? demo_people_names_match[p1]:p1.substring(0, p1.indexOf(" "))).length * 10.5) - 5).attr("width", ((((demo == 1? demo_people_names_match[p1]:p1.substring(0, p1.indexOf(" "))).length + (demo == 1? demo_people_names_match[p2]:p2.substring(0, p2.indexOf(" "))).length) * 10.5) + 10));
                            focus.select("#text_1").text((demo == 1? demo_people_names_match[p1]:p1.substring(0, p1.indexOf(" "))) + " & ");
                            focus.select("#text_2").text((demo == 1? demo_people_names_match[p2]:p2.substring(0, p2.indexOf(" "))));
                            focus.select("#x_mark").attr("x1", -xScale(d['time']));
                        }
                        else{
                            focus.select("circle").style("opacity", 0);
                            focus.select("rect").style("opacity", 0);
                            focus.select("#text_1").text("");
                            focus.select("#text_2").text("");
                        }
                    }
                    else{ 
                        focus.select("circle").style("opacity", 0);
                        focus.select("rect").style("opacity", 0);
                        focus.select("#text_1").text("");
                        focus.select("#text_2").text("");
                    }
                }
            }
        }
    }).on("mouseout", function(){
        p_svg.select("#moving_axis").style("display", "none");
        p_svg.selectAll(".focus").style("display", "none");
    });

    //stacked area chart for communication between genders
    var cover_div = d3.select("#stacked_cover")
        .style("height", svg_height * 0.87 + "px").style("width", $(window).width() * 0.8 * 0.83 + "px")
        .style("padding-left", "10px");
    var cover_div2 = d3.select("#sendTime_stacked_cover")
        .style("height", svg_height * 0.87 + "px").style("width", $(window).width() * 0.8 * 0.83 + "px")
        .style("padding-left", "10px");
    var cover_div3 = d3.select("#sendTime2_stacked_cover")
        .style("height", svg_height * 0.87 + "px").style("width", $(window).width() * 0.8 * 0.83 + "px")
        .style("padding-left", "10px");
    d3.select("#by_value").on("click", function(){
        d3.select("#by_share").style("background-color", "rgba(184,184,184,0)");
        d3.select("#by_value").style("background-color", "rgba(184,184,184,1)");
        visualization.y({"scale": "linear"}).draw();
    });
    d3.select("#by_share").on("click", function(){
        d3.select("#by_share").style("background-color", "rgba(184,184,184,1)");
        d3.select("#by_value").style("background-color", "rgba(184,184,184,0)");
        visualization.y({"scale": "share"}).draw();
    });

    var the_data = [], the_gender_data = [];
    for(var k = 0; k < Object.keys(gap['fact']['fact_diff_gender']).length; k++){
        var year = Object.keys(gap['fact']['fact_diff_gender'])[k];
        the_data.push({'year': year, 'name': 'm - f', 'emails': gap['fact']['fact_diff_gender'][year]});
        the_data.push({'year': year, 'name': 'm - m', 'emails': gap['fact']['fact_mm'][year]});
        the_data.push({'year': year, 'name': 'f - f', 'emails': gap['fact']['fact_ff'][year]});
    }
    var visualization = d3plus.viz()
        .container("#stacked_cover")
        .data(the_data)
        .type("stacked")
        .id("name")
        .text("name")
        .y("emails")
        .x({"value": "year"})
        .tooltip(['emails'])
        .font({ "size": 14 })
        // .time("year")
        .background("rgba(0,0,0,0)")
        .draw();
    // var visualization_small = d3plus.viz()
    //     .container("#stacked_gender_cover")
    //     .data(the_gender_data)
    //     .type("stacked")
    //     .id("name")
    //     .text("name")
    //     .y("emails")
    //     .x({"value": "year"})
    //     .tooltip(['emails'])
    //     .font({ "size": 14 })
    //     // .time("year")
    //     .background("rgba(0,0,0,0)")
    //     .draw();
    // setTimeout(function(){
    //     d3.select("#d3plus_graph_background").style("fill","rgba(0,0,0,0)");
    // }, 500);

    setTimeout(function(){
        d3.selectAll("#d3plus_graph_background").style("fill","rgba(0,0,0,0)");
    }, 500);

    function communication_distribution(data_name){
        var data = gap;
        var color = "steelblue";

        // Generate a 1000 data points using normal distribution with mean=20, deviation=5
        var values = data['simu']['simu_' + data_name];

        // A formatter for counts.
        var formatCount = d3.format(",.0f");
        var margin = {top: 60, right: 40, bottom: 90, left: 80};
        var svg_width = $(window).width() * 0.6, svg_height = $(window).height() * 0.45;
        var width = (svg_width - p_margin.left - p_margin.right), height = (svg_height - p_margin.top - p_margin.bottom);
        var axis_max = data['fact']['fact_' + data_name]>d3.max(values)? data['fact']['fact_' + data_name]:d3.max(values);
        var axis_min = data['fact']['fact_' + data_name]<d3.min(values)? data['fact']['fact_' + data_name]:d3.min(values);
        var max = d3.max(values);
        var min = d3.min(values);
        var x = d3.scale.linear()
              .domain([min, max])
              .range([0 + (min-axis_min)/(axis_max - axis_min)*width, width - (axis_max - max)/(axis_max - axis_min)*width]);
        var x2 = d3.scale.linear()
              .domain([axis_min, axis_max])
              .range([0, width]);

        // Generate a histogram using twenty uniformly-spaced bins.
        var data = d3.layout.histogram()
            .bins(x.ticks(20))
            (values);

        var yMax = d3.max(data, function(d){return d.length});
        var yMin = d3.min(data, function(d){return d.length});

        var y = d3.scale.linear()
            .domain([0, yMax])
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x2)
            .orient("bottom");

        var cover_div = d3.select("#analysis_pairs_cover").append("div").attr("class", "gap_cover").style("height", svg_height + "px");
        var svg = cover_div.append("svg").attr("id", "communication_gap")
            .attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom)
            .append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        var text_div = cover_div.append("div").attr("class", "text_div");
        text_div.append("div").attr("class", "communicaiton_title")
            .text(function(){
                switch(data_name){
                    case 'same_gender': return "Communicaiton between people of the same gender"; break;
                    case 'diff_gender': return "Communicaiton between people of different genders"; break;
                    case 'ff': return "Communicaiton between female members"; break;
                    case 'mm': return "Communicaiton between male members"; break;
                    default: return ""; 
                };
        });
        text_div.append("div").attr("class", "communicaiton_content")
            .text("p-value = " + gap['pvalues']['pvalue_' + data_name].toFixed(5));

        var bar = svg.selectAll(".bar")
            .data(data)
          .enter().append("g")
            .attr("class", "bar")
            .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

        bar.append("rect")
            .attr("x", 1)
            .attr("width", (x(data[0].dx) - x(0)) - 1)
            .attr("height", function(d) { return height - y(d.y); })
            .attr("fill", function(d) { return color; });

        var line = d3.svg.line()
          .x(function(d) { return x(d.x + data[0].dx/2); })
          .y(function(d) { return y(d.length); })
          .interpolate("basis"); //cardinal
        svg.append("path")
           .attr("d", line(data))
           .attr("class", "bins")
           .attr("fill", "rgba(0,0,0,0)")
           .attr("stroke", "rgb(250,250,250)");
        svg.append("line")
           .attr("x1", x(gap['fact']['fact_' + data_name])).attr("y1", y(0))
           .attr("x2", x(gap['fact']['fact_' + data_name])).attr("y2", y(yMax))
           .attr("fill", "rgba(0,0,0,0)")
           .attr("stroke", "rgb(250,100,100)")
           .attr("stroke-width", "2px");

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);
    }
    // communication_distribution('same_gender');
    // communication_distribution('diff_gender');
    // communication_distribution('ff');
    // communication_distribution('mm');

};
var show_histo_results = function(){
	var colors = ['rgb(171, 43, 43)', 'rgb(27, 70, 108)'];
	var color = d3.scale.category10().range(colors);
    var whole_data = [];
    for(var p = 0; p < usersinfo.length; p++){
        var this_user = {'name': usersinfo[p].name, 'value': 1};
        if(JSON.stringify(personalities[p]) != JSON.stringify({})){
            this_user['gender'] = personalities[p]['demographics']['gender'];
            this_user['age'] = personalities[p]['demographics']['age'];
        }
        if(JSON.stringify(demographics[p]) != JSON.stringify({})){
            for(var key in demographics[p]){
                this_user[key] = demographics[p][key];
            }
            var conti = "null";
            for(var l in continents_countries){
                if(continents_countries[l].indexOf(demographics[p]['nationality']) != -1){
                    conti = l; break;
                }
            }
            this_user['continent'] = conti;
        }
        whole_data.push(this_user);
    }
    // console.log(whole_data);

    d3.select("#analysis_histo_cover").style("display", "block");
    //tree gender
    var p_margin = {top: 0, right: 70, bottom: 50, left: 80};
    var svg_width = $(window).width() * 0.8 * 0.5, svg_height = $(window).height() * 0.35;
    var p_width = svg_width - p_margin.left - p_margin.right, p_height = svg_height - p_margin.top - p_margin.bottom;
    var p_svg = d3.select("#gender_svg")
        .style("width", (p_width + 25) + "px").style("height", (p_height) + "px")
        .style("margin-left", (p_margin.left - 25) + "px").style("margin-right", p_margin.right + "px")
        .style("margin-top", p_margin.top + "px").style("margin-bottom", (p_margin.bottom + 50) + "px");

    var gender = [{'gender': 'female', 'num': 0}, {'gender': 'male', 'num': 0}];
    for(var p = 0; p < personalities.length; p++){
        if(JSON.stringify(personalities[p]) != JSON.stringify({})){
            if(personalities[p]['demographics']['gender'] == 'm')
                gender[1]['num'] ++;
            else
                gender[0]['num'] ++;
        }
    }
    var total = (gender[0]['num'] + gender[1]['num']);

	var visualization = d3plus.viz()
	    .container("#gender_svg")
	    .data(gender)
	    .type("tree_map")
	    .id("gender")
	    .size("num")
        .background("#2f3140")
	    .color({"scale": color})
        .labels({"align": "left", "valign": "top"})
	    .draw();

    // var yScale = d3.scale.linear().range([p_height, 0]), // value -> display
    //     yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(5);
    // yScale.domain([0, total]);
    
    // var barWidth = p_width / 2;
    // function make_y_axis() {        
    //     return d3.svg.axis()
    //         .scale(yScale)
    //          .orient("left")
    //          .ticks(5);
    // }
    // p_svg.append("g")         
    //     .attr("class", "grid")
    //     .call(make_y_axis()
    //         .tickSize(-p_width, 0, 0)
    //         .tickFormat("")
    //     );
    // p_svg.append("g") //y-axis
    //     .attr("class", "y axis")
    //     .call(yAxis);
    // p_svg.select(".grid").selectAll("path").style("opacity", 0);
    // p_svg.select(".y.axis").selectAll("line").style("stroke", "rgba(255,255,255,0.4)");
    // p_svg.select(".y.axis").selectAll("path").style("opacity", 0);
    // var bar = p_svg.append("g").selectAll("g")
    //   .data(gender)
    //   .enter().append("g")
    //   .attr("transform", function(d, i) { return "translate(" + i * barWidth + ",0)"; });
    // bar.append("rect")
    //   .attr("y", function(d) { return yScale(d.num); })
    //   .attr("height", function(d) { return p_height - yScale(d.num); })
    //   .attr("fill", function(d){ 
    //       if(d.gender == "m") return "rgb(20,50,78)"; 
    //       return "rgb(163,41,41)";
    //   })
    //   .attr("width", barWidth - 1);
    // bar.append("text")
    //   .attr("x", barWidth / 2)
    //   .attr("y", function(d) { return p_height + 8; })
    //   .attr("dy", ".75em")
    //   .text(function(d) { 
    //       if(d.gender == 'm') return "Male"; 
    //       return "Female";
    //   });
    // p_svg.append("text")
    //   .attr("x", 0).attr("y", -10).style("font-size", "24px")
    //   .attr("dy", "0").text("Gender");

    //histo age by gender
    var p_data = new Array(usersinfo.length);
    for(var p = 0; p < usersinfo.length; p++){
        if(JSON.stringify(personalities[p]) != JSON.stringify({})){
            p_data[p] = personalities[p]['demographics']['age'];
        }
    }
    var p_margin2 = {top: 40, right: 70, bottom: 40, left: 80};
    var formatCount = d3.format(",.0f");
    var p_svg = d3.select("#age_svg").style("padding-top", p_margin2.top + "px")
        .attr("width", p_width + p_margin2.left + p_margin2.right).attr("height", p_height + p_margin2.top + p_margin2.bottom + 0)
        .append("g").attr("transform", "translate(" + p_margin2.left + "," + p_margin2.top + ")");
    var yScale = d3.scale.linear().range([p_height - 15, 0]), // value -> display
        yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(5);
    var xScale = d3.scale.linear().range([0, p_width]),
        xAxis = d3.svg.axis().scale(xScale).orient("bottom");
    var xMax = d3.max(p_data, function(d){return d;}),
    	xMin = d3.min(p_data, function(d){return d;});
    xScale.domain([((Math.floor(xMin/10)==0? 1:(Math.floor(xMin/10))) - 1) * 10, (Math.floor(xMax/10) + 2) * 10]);
    xAxis.tickValues(d3.range(((Math.floor(xMin/10)==0? 1:(Math.floor(xMin/10))) - 1) * 10, (Math.floor(xMax/10) + 3) * 10, 10));
    
    var ranges = d3.range(((Math.floor(xMin/10)==0? 1:(Math.floor(xMin/10))) - 1) * 10, (Math.floor(xMax/10) + 2) * 10, 10);
    var stackedData = [];
    for(var k = 0; k < ranges.length; k++){
    	stackedData.push({age: ranges[k], female: 0, male: 0});
    }
    for(var p = 0; p < usersinfo.length; p++){
    	if(JSON.stringify(personalities[p]) != JSON.stringify({})){
    		if(personalities[p]['demographics']['gender'] == "m")
            	stackedData[ranges.indexOf(personalities[p]['demographics']['age'] - personalities[p]['demographics']['age']%10)]["male"]++
            else
            	stackedData[ranges.indexOf(personalities[p]['demographics']['age'] - personalities[p]['demographics']['age']%10)]["female"]++
        }
    }

    // var data = d3.layout.histogram()
    //     .bins(xScale.ticks((Math.floor(xMax/10) + 2) - (Math.floor(xMin/10)==0? 1:(Math.floor(xMin/10)) - 1)))
    //     (p_data);
    var genders = ["female", "male"];
    var layers = d3.layout.stack()(genders.map(function(c) {
	    return stackedData.map(function(d) {
	      return {x: d.age, y: d[c], label: c};
	    });
	}));
    var yMax = d3.max(stackedData, function(d){return (d.female + d.male)});
    var yMin = d3.min(stackedData, function(d){return (d.female + d.male)});
    yScale.domain([0, yMax]);
    
    function make_y_axis2() {        
        return d3.svg.axis()
            .scale(yScale)
             .orient("left")
             .ticks(5);
    }
    p_svg.append("g")         
        .attr("class", "grid")
        .call(make_y_axis2()
            .tickSize(-p_width, 0, 0)
            .tickFormat("")
        );
    p_svg.append("g") //y-axis
        .attr("class", "y axis")
        .call(yAxis);
    p_svg.select(".grid").selectAll("path").style("opacity", 0);
    p_svg.select(".y.axis").selectAll("line").style("stroke", "rgba(255,255,255,0.4)");
    p_svg.select(".y.axis").selectAll("path").style("opacity", 0);

    var layer = p_svg.selectAll(".layer")
	      .data(layers)
	    .enter().append("g")
	      .attr("class", "layer")
	      .style("fill", function(d, i) { return color(i); });

	layer.selectAll("rect")
	      .data(function(d) { return d; })
	    .enter().append("rect")
	      .attr("x", function(d) { return xScale(d.x); })
	      .attr("y", function(d) { return yScale(d.y + d.y0); })
	      .attr("height", function(d) { return yScale(d.y0) - yScale(d.y + d.y0); })
	      .attr("width", xScale.range()[1]/(ranges.length) - 1)
              .style("opacity", 0.9)
	      .on("mouseover", function() { 
                d3.select(this).style("opacity", 1);
                tooltip.style("display", "block"); 
              })
              .on("mouseout", function() { 
                d3.select(this).style("opacity", 0.9);
                tooltip.style("display", "none"); 
              })
	      .on("mousemove", function(d){
	      	var xPosition = d3.mouse(this)[0] - 15;
		    var yPosition = d3.mouse(this)[1] - 27;
		    tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
		    tooltip.select("text").text(d.label + ": " + d.y);
	      });
    p_svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (p_height - 15) + ")")
        .call(xAxis);
    p_svg.append("text")
      .attr("x", -25).attr("y", -30).style("font-size", "24px")
      .attr("dy", "0").text("Age");

    var tooltip = p_svg.append("g")
	  .attr("class", "tooltip")
	  .style("display", "none");
	    
	tooltip.append("rect")
	  .attr("width", 90)
	  .attr("height", 26)
	  .attr("fill", "white")
	  .style("opacity", 1.0);

	tooltip.append("text")
	  .attr("x", 15)
	  .attr("dy", "1.2em")
	  // .style("text-anchor", "middle")
	  .attr("font-size", "12px")
	  .attr("font-weight", 200)
	  .attr("stroke", "black").style("fill", "black");


    //tree nationality
    var p_svg = d3.select("#nationality_svg")
        .style("width", (p_width + 25) + "px").style("height", (p_height) + "px")
        .style("margin-left", (p_margin.left - 25) + "px").style("margin-right", p_margin.right + "px")
        .style("margin-top", (p_margin.top - 10) + "px").style("margin-bottom", (p_margin.bottom + 50) + "px");
    var nationality = [], nationality_mapping = {}, 
        number_by_conti = {
            "Africa": 0,
            "Asia": 0, 
            "Europe": 0,
            "North America": 0,
            "Central America": 0,
            "South America": 0,
            "Oceania": 0 
        };
    for(var p = 0; p < demographics.length; p++){
        if(JSON.stringify(demographics[p]) != JSON.stringify({})){
            if('nationality' in demographics[p] && demographics[p]['nationality'] in nationality_mapping){
                nationality_mapping[demographics[p]['nationality']]['num'] ++;
                // nationality_mapping[demographics[p]['nationality']]['people'].push(usersinfo[p]['name']);
            }
            else{
                var conti = "null";
                for(var l in continents_countries){
                    if(continents_countries[l].indexOf(demographics[p]['nationality']) != -1){
                        conti = l; break;
                    }
                }
                nationality_mapping[demographics[p]['nationality']] = {'country': demographics[p]['nationality'], 'continent': conti, 'color': continents_colors[conti], 'num': 1};
            }
        }
    }
    for(var country in nationality_mapping){
        nationality.push(nationality_mapping[country]);
        number_by_conti[nationality_mapping[country]['continent']] += nationality_mapping[country]['num'];
    }
    // console.log(number_by_conti);
    var visualization = d3plus.viz()
        .container("#nationality_svg")
        .data(nationality)
        .type("tree_map")
        .id(["continent", "country"])
        .size("num")
        // .color("continent")
        .tooltip(["continent"])
        .color(function(d){
            return d.color;
        })
        .legend(false)
        .depth(1)
        .background("#2f3140")
        // .height({"small": 100})
        // .width({"small": 50})
        .labels({"align": "left", "valign": "top"})
        .draw();  


    //nationality stacked bar
    d3.select("#nationality_stacked_svg")
        .style("width", (p_width + 35) + "px").style("height", (p_height + 20) + "px")
        .style("margin-left", (p_margin.left - 25) + "px").style("margin-right", p_margin.right-10 + "px")
        .style("margin-top", (p_margin.top - 30) + "px").style("margin-bottom", (p_margin.bottom + 50) + "px");
    var nationality_stacked = whole_data.filter(function (member) {//modify for slack
        return ('nationality' in member); //the_id
    });
    var gender_attr = [
        {"gender": "m", "hex": '#1b466c'},
        {"gender": "f", "hex": '#ab2b2b'}
    ];
    var max = 0;
    for(var l in number_by_conti) if(number_by_conti[l] > max) max = number_by_conti[l];
    var ticks_array = [];
    for(var k = 0; k <= max; k++) ticks_array.push(k);
    var stacked_nationality;

    function dimension_change(dimension){
        var the_dimension = "gender";
        switch(dimension){
            case 'Gender': 
                the_dimension = "gender";
                break;
            case 'College major': 
                the_dimension = "major_college";
                break;
            case 'Graduate major': 
                the_dimension = "major_graduate";
                break;
            case 'Position': 
                the_dimension = "position";
                break;
            case 'Degree': 
                the_dimension = "degree";
                break;
            default:
                alert("dimension error");

        }
        if(the_dimension == 'gender'){
            stacked_nationality
                .data(nationality_stacked)
                // .type("bar")
                .id(the_dimension)
                .legend(false)
                // .y({"stacked": true, "value": "value", "ticks": ticks_array})
                // .x("continent")
                // .tooltip(["continent"])
                // .background("#2f3140")
                // .x({'label': false, 'grid': false, 'ticks':{'font':{'size': '14'}}})
                // .y({'label': false, 'ticks':{'size': 3}})
                .attrs(gender_attr)
                .color("hex")
                // .x({'axis': {'color': '#ccc'}})
                .draw();
        }
        else{
            stacked_nationality
                .data(nationality_stacked)
                // .type("bar")
                .id(the_dimension)
                .legend(true)
                // .y({"stacked": true, "value": "value", "ticks": ticks_array})
                // .x("continent")
                // .tooltip(["continent"])
                // .background("#2f3140")
                // .x({'label': false, 'grid': false, 'ticks':{'font':{'size': '14'}}})
                // .y({'label': false, 'ticks':{'size': 3}})
                // .x({'axis': {'color': '#ccc'}})
                .attrs(false)
                .color(the_dimension)
                .draw();
        }
        setTimeout(function(){ 
            // stacked_nationality.x({'axis': {'color': '#ccc'}}).draw();
            d3.select("#nationality_stacked_svg").select("#d3plus_graph_ygrid").select("line").attr("stroke", "#CCC")
            // d3.select("#nationality_stacked_svg").select("#d3plus_graph_background").style("display", "none")
        }, 500);
    }
    stacked_nationality = d3plus.viz()
        .container("#nationality_stacked_svg")
        .data(nationality_stacked)
        .type("bar")
        .id('gender')
        .legend(false)
        .y({"stacked": true, "value": "value", "ticks": ticks_array})
        .order("value")
        .order({"agg": "sum"})
        .x("continent")
        .tooltip(["continent"])
        .background("#2f3140")
        .x({'label': false, 'grid': false, 'ticks':{'font':{'size': '14'}}})
        .y({'label': false, 'ticks':{'size': 3}})
        .attrs(gender_attr)
        .color("hex")
        .x({'axis': {'color': '#ccc'}})
        .draw();
    setTimeout(function(){ 
        // stacked_nationality.x({'axis': {'color': '#ccc'}}).draw();
        d3.select("#nationality_stacked_svg").select("#d3plus_graph_ygrid").select("line").attr("stroke", "#CCC")
        d3.select("#nationality_stacked_svg").select("#d3plus_graph_background").style("display", "none")
    }, 500);

    var selectData = [
        {'dimension': 'Gender'}, 
        // {'dimension': 'Age'}, 
        {'dimension': 'College major'}, 
        {'dimension': 'Graduate major'},
        {'dimension': 'Position'}, 
        {'dimension': 'Degree'}
    ];
    var memberInput = d3.select("#dimensionSelect").select("ul")
    .selectAll('li')
      .data(selectData)
      .enter().append('li').attr("class", "for_dim").attr("id", function(d, i) { return "dim_" + i;})
      .html(function(d, i){ return '<div class="a_dim">'+ d.dimension + '</div>';})
      .on("click", function(d, i){
        d3.select("#dimensionSelect").select(".anchor2").text(d.dimension);
        dims.classList.remove('visible');
        dims.style.display = "none";
        dimension_change(d.dimension);
      });
    var checkList = document.getElementById('dimensionSelect');
    var dims = document.getElementById('dims');
    var the_members = dims.getElementsByTagName("div");
    checkList.getElementsByClassName('anchor2')[0].onclick = function (evt) {
        if (dims.classList.contains('visible')){
            dims.classList.remove('visible');
            dims.style.display = "none";
        }
        else{
            dims.classList.add('visible');
            dims.style.display = "block";
        }
    }
    dims.onblur = function(evt) {
        dims.classList.remove('visible');
    }
};


var show_histo_results2 = function(){
    var colors = ['rgb(171, 43, 43)', 'rgb(27, 70, 108)'];
    var color = d3.scale.category10().range(colors);
    var whole_data = [];
    var number_by_position = [], number_by_degree = [], number_by_college_major = [], number_by_graduate_major = [];
    var position = {}, degree = {}, college_major = {}, graduate_major = {};
    for(var p = 0; p < usersinfo.length; p++){
        var this_user = {'name': usersinfo[p].name, 'value': 1};
        if(JSON.stringify(personalities[p]) != JSON.stringify({})){
            this_user['gender'] = personalities[p]['demographics']['gender'];
            this_user['age'] = personalities[p]['demographics']['age'];
        }
        if(JSON.stringify(demographics[p]) != JSON.stringify({})){
            for(var key in demographics[p]){
                this_user[key] = demographics[p][key];
            }
            if(!(demographics[p]['degree'] in degree)) degree[demographics[p]['degree']] = 1;
            else degree[demographics[p]['degree']]++;
            if(!(demographics[p]['position'] in position)) position[demographics[p]['position']] = 1;
            else position[demographics[p]['position']]++;
            if(!(demographics[p]['major_college'] in college_major)) college_major[demographics[p]['major_college']] = 1;
            else college_major[demographics[p]['major_college']]++;
            if(!(demographics[p]['major_graduate'] in graduate_major)) graduate_major[demographics[p]['major_graduate']] = 1;
            else graduate_major[demographics[p]['major_graduate']]++;

            var conti = "null";
            for(var l in continents_countries){
                if(continents_countries[l].indexOf(demographics[p]['nationality']) != -1){
                    conti = l; break;
                }
            }
            this_user['continent'] = conti;
        }
        whole_data.push(this_user);
    }
    var gender_attr = [
        {"gender": "m", "hex": '#1b466c'},
        {"gender": "f", "hex": '#ab2b2b'}
    ];
    
    // d3.select("#analysis_histo_cover2").style("display", "block");
    //tree position
    var p_margin = {top: -30, right: 70, bottom: 50, left: 80};
    var svg_width = $(window).width() * 0.8 * 0.5, svg_height = $(window).height() * 0.227;
    var p_width = svg_width - p_margin.left - p_margin.right, p_height = svg_height - p_margin.top - p_margin.bottom;
    var p_svg = d3.select("#position_svg")
        .style("width", (p_width + 25) + "px").style("height", (p_height) + "px")
        .style("margin-left", (p_margin.left - 25) + "px").style("margin-right", p_margin.right + "px")
        .style("margin-top", (p_margin.top) + "px").style("margin-bottom", (p_margin.bottom) + "px");
    var position_stacked = whole_data.filter(function (member) {//modify for slack
        return ('position' in member); //the_id
    });
    var visualization_position = d3plus.viz()
        .container("#position_svg")
        .data(position_stacked)
        .type("tree_map")
        .id("position")
        .size("value")
        .depth(1)
        // .font({'color': })
        // .tooltip(["position"])
        .color('position')
        .legend(false)
        .background("#2f3140")
        // .height({"small": 100})
        // .width({"small": 50})
        .labels({"align": "left", "valign": "top"})
        .draw();  


    //position stacked bar
    d3.select("#position_stacked_svg")
        .style("width", (p_width + 35) + "px").style("height", (p_height + 8) + "px")
        .style("margin-left", (p_margin.left - 25) + "px").style("margin-right", p_margin.right-10 + "px")
        .style("margin-top", (p_margin.top - 10) + "px").style("margin-bottom", (p_margin.bottom + 40) + "px");
    for(var l in position) number_by_position.push(position[l]);
    var max = 0;
    for(var l in number_by_position) if(number_by_position[l] > max) max = number_by_position[l];
    var ticks_array = [];
    for(var k = 0; k <= max; k++) ticks_array.push(k);
    var stacked_position, stacked_major, stacked_degree;

    stacked_position = d3plus.viz()
        .container("#position_stacked_svg")
        .data(position_stacked)
        .type("bar")
        .id('gender')
        .legend(false)
        .y({"stacked": true, "value": "value", "ticks": ticks_array})
        .order("value")
        .order({"agg": "sum"})
        .x("position")
        .tooltip(["position"])
        .background("#2f3140")
        .x({'label': false, 'grid': false, 'ticks':{'font':{'size': '14'}}})
        .y({'label': false, 'ticks':{'size': 3}})
        .attrs(gender_attr)
        .color("hex")
        .x({'axis': {'color': '#ccc'}})
        .draw();
    setTimeout(function(){ 
        // stacked_nationality.x({'axis': {'color': '#ccc'}}).draw();
        d3.select("#position_stacked_svg").select("#d3plus_graph_ygrid").select("line").attr("stroke", "#CCC")
        d3.select("#position_stacked_svg").select("#d3plus_graph_background").style("display", "none")
    }, 500);

    var selectData = [
        {'dimension': 'Gender'}, 
        {'dimension': 'Nationality'},
        // {'dimension': 'Age'}, 
        {'dimension': 'College major'}, 
        {'dimension': 'Graduate major'},
        // {'dimension': 'Position'}, 
        {'dimension': 'Degree'}
    ];
    var memberInput = d3.select("#dimensionSelect_position").select("ul")
    .selectAll('li')
      .data(selectData)
      .enter().append('li').attr("class", "for_dim").attr("id", function(d, i) { return "dim_" + i;})
      .html(function(d, i){ return '<div class="a_dim">'+ d.dimension + '</div>';})
      .on("click", function(d, i){
        d3.select("#dimensionSelect_position").select(".anchor2").text(d.dimension);
        dims.classList.remove('visible');
        dims.style.display = "none";
        dimension_change('position', d.dimension);
      });
    var checkList = document.getElementById('dimensionSelect_position');
    var dims = document.getElementById('dims_position');
    var the_members = dims.getElementsByTagName("div");
    checkList.getElementsByClassName('anchor2')[0].onclick = function (evt) {
        if (dims.classList.contains('visible')){
            dims.classList.remove('visible');
            dims.style.display = "none";
        }
        else{
            dims.classList.add('visible');
            dims.style.display = "block";
        }
    }
    dims.onblur = function(evt) {
        dims.classList.remove('visible');
    }

    //tree major
    var p_svg = d3.select("#major_svg")
        .style("width", (p_width + 25) + "px").style("height", (p_height) + "px")
        .style("margin-left", (p_margin.left - 25) + "px").style("margin-right", p_margin.right + "px")
        .style("margin-top", (p_margin.top) + "px").style("margin-bottom", (p_margin.bottom) + "px");
    var major_stacked = whole_data.filter(function (member) {//modify for slack
        return ('major_college' in member); //the_id
    });
    var visualization_major = d3plus.viz()
        .container("#major_svg")
        .data(major_stacked)
        .type("tree_map")
        .id("major_college")
        .size("value")
        .depth(1)
        // .tooltip(["position"])
        // .color('major_college')
        .legend(false)
        .background("#2f3140")
        .ui([
          {
            "method" : "id",
            "value"  : [ "major_college" , "major_graduate" ]
          }
        ])
        .labels({"align": "left", "valign": "top"})
        .draw();  
    //stacked major
    d3.select("#major_stacked_svg")
        .style("width", (p_width + 35) + "px").style("height", (p_height + 8) + "px")
        .style("margin-left", (p_margin.left - 25) + "px").style("margin-right", p_margin.right-10 + "px")
        .style("margin-top", (p_margin.top - 10) + "px").style("margin-bottom", (p_margin.bottom + 40) + "px");
    for(var l in college_major) number_by_college_major.push(college_major[l]);
    var max = 0;
    for(var l in number_by_college_major) if(number_by_college_major[l] > max) max = number_by_college_major[l];
    var ticks_array = [];
    for(var k = 0; k <= max; k++) ticks_array.push(k);

    stacked_major = d3plus.viz()
        .container("#major_stacked_svg")
        .data(major_stacked)
        .type("bar")
        .id('gender')
        .legend(false)
        .y({"stacked": true, "value": "value", "ticks": ticks_array})
        .order("value")
        .order({"agg": "sum"})
        .x("major_college")
        .tooltip(["major_college", "major_graduate"])
        .background("#2f3140")
        .x({'label': false, 'grid': false, 'ticks':{'font':{'size': '14'}}})
        .y({'label': false, 'ticks':{'size': 3}})
        .attrs(gender_attr)
        .color("hex")
        .x({'axis': {'color': '#ccc'}})
        .draw();
    setTimeout(function(){ 
        // stacked_nationality.x({'axis': {'color': '#ccc'}}).draw();
        d3.select("#major_stacked_svg").select("#d3plus_graph_ygrid").select("line").attr("stroke", "#CCC");
        d3.select("#major_stacked_svg").select("#d3plus_graph_background").style("display", "none");
        d3.select("#major_svg").selectAll(".d3plus_toggle").on("click",function(d,i){
            if(i == 0){//college major
                major_selected = 'major_college';
                dimension_change('major_college', major_dim_selected);
                d3.select("#major_stacked_svg").select("#major_text").text("College major by");
            }
            else{//graduate major
                major_selected = 'major_graduate';
                dimension_change('major_graduate', major_dim_selected);
                d3.select("#major_stacked_svg").select("#major_text").text("Graduate major by");
            }
        })
    }, 500);

    var selectData2 = [
        {'dimension': 'Gender'}, 
        {'dimension': 'Nationality'},
        // {'dimension': 'Age'}, 
        // {'dimension': 'College major'}, 
        // {'dimension': 'Graduate major'},
        {'dimension': 'Position'}, 
        {'dimension': 'Degree'}
    ];
    var memberInput = d3.select("#dimensionSelect_major").select("ul")
    .selectAll('li')
      .data(selectData2)
      .enter().append('li').attr("class", "for_dim").attr("id", function(d, i) { return "dim_" + i;})
      .html(function(d, i){ return '<div class="a_dim">'+ d.dimension + '</div>';})
      .on("click", function(d, i){
        d3.select("#dimensionSelect_major").select(".anchor2").text(d.dimension);
        dims2.classList.remove('visible');
        dims2.style.display = "none";
        dimension_change(major_selected, d.dimension);
      });
    var checkList2 = document.getElementById('dimensionSelect_major');
    var dims2 = document.getElementById('dims_major');
    var the_members2 = dims2.getElementsByTagName("div");
    checkList2.getElementsByClassName('anchor2')[0].onclick = function (evt) {
        if (dims2.classList.contains('visible')){
            dims2.classList.remove('visible');
            dims2.style.display = "none";
        }
        else{
            dims2.classList.add('visible');
            dims2.style.display = "block";
        }
    }
    dims2.onblur = function(evt) {
        dims2.classList.remove('visible');
    }


    //tree degree
    var p_svg = d3.select("#degree_svg")
        .style("width", (p_width + 25) + "px").style("height", (p_height) + "px")
        .style("margin-left", (p_margin.left - 25) + "px").style("margin-right", p_margin.right + "px")
        .style("margin-top", (p_margin.top) + "px").style("margin-bottom", (p_margin.bottom) + "px");
    var degree_stacked = whole_data.filter(function (member) {//modify for slack
        return ('degree' in member); //the_id
    });
    var visualization_degree = d3plus.viz()
        .container("#degree_svg")
        .data(degree_stacked)
        .type("tree_map")
        .id("degree")
        .size("value")
        .depth(1)
        // .tooltip(["position"])
        .color('degree')
        .legend(false)
        .background("#2f3140")
        // .height({"small": 100})
        // .width({"small": 50})
        .labels({"align": "left", "valign": "top"})
        .draw();  
    //stacked degree
    d3.select("#degree_stacked_svg")
        .style("width", (p_width + 35) + "px").style("height", (p_height + 8) + "px")
        .style("margin-left", (p_margin.left - 25) + "px").style("margin-right", p_margin.right-10 + "px")
        .style("margin-top", (p_margin.top - 10) + "px").style("margin-bottom", (p_margin.bottom + 40) + "px");
    for(var l in degree) number_by_degree.push(degree[l]);
    var max = 0;
    for(var l in number_by_degree) if(number_by_degree[l] > max) max = number_by_degree[l];
    var ticks_array = [];
    for(var k = 0; k <= max; k++) ticks_array.push(k);

    stacked_degree = d3plus.viz()
        .container("#degree_stacked_svg")
        .data(degree_stacked)
        .type("bar")
        .id('gender')
        .legend(false)
        .y({"stacked": true, "value": "value", "ticks": ticks_array})
        .order("value")
        .order({"agg": "sum"})
        .x("degree")
        .tooltip(["degree"])
        .background("#2f3140")
        .x({'label': false, 'grid': false, 'ticks':{'font':{'size': '14'}}})
        .y({'label': false, 'ticks':{'size': 3}})
        .attrs(gender_attr)
        .color("hex")
        .x({'axis': {'color': '#ccc'}})
        .draw();
    setTimeout(function(){ 
        // stacked_nationality.x({'axis': {'color': '#ccc'}}).draw();
        d3.select("#degree_stacked_svg").select("#d3plus_graph_ygrid").select("line").attr("stroke", "#CCC")
        d3.select("#degree_stacked_svg").select("#d3plus_graph_background").style("display", "none")
    }, 500);

    var selectData3 = [
        {'dimension': 'Gender'}, 
        {'dimension': 'Nationality'},
        // {'dimension': 'Age'}, 
        {'dimension': 'College major'}, 
        {'dimension': 'Graduate major'},
        {'dimension': 'Position'}
        // {'dimension': 'Degree'}
    ];
    var memberInput = d3.select("#dimensionSelect_degree").select("ul")
    .selectAll('li')
      .data(selectData3)
      .enter().append('li').attr("class", "for_dim").attr("id", function(d, i) { return "dim_" + i;})
      .html(function(d, i){ return '<div class="a_dim">'+ d.dimension + '</div>';})
      .on("click", function(d, i){
        d3.select("#dimensionSelect_degree").select(".anchor2").text(d.dimension);
        dims3.classList.remove('visible');
        dims3.style.display = "none";
        dimension_change('degree', d.dimension);
      });
    var checkList3 = document.getElementById('dimensionSelect_degree');
    var dims3 = document.getElementById('dims_degree');
    var the_members3 = dims3.getElementsByTagName("div");
    checkList3.getElementsByClassName('anchor2')[0].onclick = function (evt) {
        if (dims3.classList.contains('visible')){
            dims3.classList.remove('visible');
            dims3.style.display = "none";
        }
        else{
            dims3.classList.add('visible');
            dims3.style.display = "block";
        }
    }
    dims3.onblur = function(evt) {
        dims3.classList.remove('visible');
    }


    function dimension_change(svg, dimension){
        var the_dimension = "gender";
        var the_svg = stacked_position, the_data = position_stacked, the_svg_id = "#position_stacked_svg";
        switch(dimension){
            case 'Gender': 
                the_dimension = "gender";
                break;
            case 'College major': 
                the_dimension = "major_college";
                break;
            case 'Graduate major': 
                the_dimension = "major_graduate";
                break;
            case 'Position': 
                the_dimension = "position";
                break;
            case 'Degree': 
                the_dimension = "degree";
                break;
            case 'Nationality':
                the_dimension = "nationality";
                break;
            default:
                alert("dimension error");
        }
        switch(svg){
            case 'position': 
                the_svg = stacked_position;
                the_data = position_stacked;
                the_svg_id = "#position_stacked_svg"
                break;
            case 'major_college': 
                the_svg = stacked_major;
                the_data = major_stacked;
                the_svg_id = "#major_stacked_svg";
                major_dim_selected = dimension;
                break;
            case 'major_graduate': 
                the_svg = stacked_major;
                the_data = major_stacked;
                the_svg_id = "#major_stacked_svg";
                major_dim_selected = dimension;
                break;
            case 'degree': 
                the_svg = stacked_degree;
                the_data = degree_stacked;
                the_svg_id = "#degree_stacked_svg"
                break;
            default:
                alert("svg error");
        }
        if(the_dimension == 'gender'){
            if(svg == 'major_college' || svg == 'major_graduate'){
                var number_by_xxx = (svg == 'major_college'? number_by_college_major:number_by_graduate_major),
                    xxx_major = (svg == 'major_college'? college_major:graduate_major);
                for(var l in xxx_major) number_by_xxx.push(xxx_major[l]);
                var max = 0;
                for(var l in number_by_xxx) if(number_by_xxx[l] > max) max = number_by_xxx[l];
                var ticks_array = [];
                for(var k = 0; k <= max; k++) ticks_array.push(k);

                the_svg
                    .data(the_data)
                    .id(the_dimension)
                    .x(svg)
                    .y({"ticks": ticks_array})
                    .legend(false)
                    .attrs(gender_attr)
                    .color("hex")
                    .draw();
            }
            else{
                the_svg
                    .data(the_data)
                    .id(the_dimension)
                    .legend(false)
                    .attrs(gender_attr)
                    .color("hex")
                    // .x({'axis': {'color': '#ccc'}})
                    .draw();
            }
        }
        else{
            if(svg == 'major_college' || svg == 'major_graduate'){
                var number_by_xxx = (svg == 'major_college'? number_by_college_major:number_by_graduate_major),
                    xxx_major = (svg == 'major_college'? college_major:graduate_major);
                for(var l in xxx_major) number_by_xxx.push(xxx_major[l]);
                var max = 0;
                for(var l in number_by_xxx) if(number_by_xxx[l] > max) max = number_by_xxx[l];
                var ticks_array = [];
                for(var k = 0; k <= max; k++) ticks_array.push(k);

                the_svg
                    .data(the_data)
                    .id(the_dimension)
                    .x(svg)
                    .y({"ticks": ticks_array})
                    .legend(true)
                    .legend({'size': 20})
                    .attrs(false)
                    .color(the_dimension)
                    .draw();
            }
            else{
                the_svg
                    .data(the_data)
                    .id(the_dimension)
                    .legend(true)
                    .legend({'size': 20})
                    .attrs(false)
                    .color(the_dimension)
                    .draw();
            }
        }
        setTimeout(function(){ 
            // stacked_nationality.x({'axis': {'color': '#ccc'}}).draw();
            d3.select(the_svg_id).select("#d3plus_graph_ygrid").select("line").attr("stroke", "#CCC")
            // d3.select("#position_stacked_svg").select("#d3plus_graph_background").style("display", "none")
        }, 500);
    }
    // d3.select("#analysis_histo_cover2").style("display", "none");
};

var show_team_summary = function(){
    if(metrics != null){
        var metrics_current_data = "closeness";
        d3.select("#centrality_svg").style("height", $("#analysis_content").height() * 0.65 + 40 + "px")
            .style("margin-top", 0 + "px").style("margin-bottom", (30) + "px");
        d3.select("#density_svg").style("height", $("#analysis_content").height() * 0.35 + 40 + "px")
            .style("margin-top", 0 + "px").style("margin-bottom", (0) + "px");
        var position_color = {
            "(Research) Professor": "#b22200", 
            "(Research) Administrative": "#B35C1E", 
            "(Research) Research Scientist": "#224F20", 
            "(Research) Lecturer":  "#afd5e8",
            "(Research) Postdoc": "#e89c89", 
            "(Research) PhD student": "#EACE3F", 
            "(Research) Master's student": "#759143", 
            "(Research) Undergraduate": "#a5c697", 
            "(Research) Other": "#bdbdbd", 
            "(Company) President": "#282F6B", 
            "(Company) Director": "#993F88", 
            "(Company) Manager": "#ffee8d", 
            "(Company) Employee": "#d1d392", 
            "(Company) Other": "#bdbdbd",
            "NA": "#d9d9d9"
        };
        var position_short = {
            "(Research) Professor": "Prof", 
            "(Research) Administrative": "Admin", 
            "(Research) Research Scientist": "R.Sci", 
            "(Research) Lecturer":  "Lec",
            "(Research) Postdoc": "Postdoc", 
            "(Research) PhD student": "PhD", 
            "(Research) Master's student": "MS", 
            "(Research) Undergraduate": "Ugrd", 
            "(Research) Other": "Other", 
            "(Company) President": "Pres", 
            "(Company) Director": "Dir", 
            "(Company) Manager": "Mgr", 
            "(Company) Employee": "Empl", 
            "(Company) Other": "Other",
            "NA": "NA"
        };
        var centrality_data1 = [], centrality_data2 = [], centrality_data3 = [], density_data = [];
        for(var kk = 0; kk < metrics.users.length; kk++){
            var name_ind = 0;
            for(var tt= 0; tt < usersinfo.length; tt++){
                if(usersinfo[tt].name == metrics.users[kk].name){
                    name_ind = tt; break
                }
            }
            for(var mm = 0; mm < metrics.months.length; mm++){
                centrality_data1.push({
                    "name": metrics.users[kk].name,
                    "color": position_color[('position' in demographics[name_ind] ? demographics[name_ind]['position'] : 'NA')],
                    "date": metrics.months[mm], 
                    "position": ('position' in demographics[name_ind] ? demographics[name_ind]['position'] : 'NA'),
                    "position_short": position_short[('position' in demographics[name_ind] ? demographics[name_ind]['position'] : 'NA')],
                    "type": "closeness",
                    "value": metrics.closeness[kk][mm]});
                centrality_data2.push({
                    "name": metrics.users[kk].name,
                    "color": position_color[('position' in demographics[name_ind] ? demographics[name_ind]['position'] : 'NA')],
                    "date": metrics.months[mm], 
                    "position": ('position' in demographics[name_ind] ? demographics[name_ind]['position'] : 'NA'),
                    "position_short": position_short[('position' in demographics[name_ind] ? demographics[name_ind]['position'] : 'NA')],
                    "type": "betweenness",
                    "value": metrics.betweenness[kk][mm]});
                centrality_data3.push({
                    "name": metrics.users[kk].name,
                    "color": position_color[('position' in demographics[name_ind] ? demographics[name_ind]['position'] : 'NA')],
                    "date": metrics.months[mm], 
                    "position": ('position' in demographics[name_ind] ? demographics[name_ind]['position'] : 'NA'),
                    "position_short": position_short[('position' in demographics[name_ind] ? demographics[name_ind]['position'] : 'NA')],
                    "type": "degree",
                    "value": metrics.degree[kk][mm]});
            }
        }
        for(var mm = 0; mm < metrics.months.length; mm++){
            density_data.push({
                "color": "#ffffff",
                "date": metrics.months[mm], 
                "type": "density",
                "value": metrics.density[mm]});
            density_data.push({
                "color": "#ff8899",
                "date": metrics.months[mm], 
                "type": "density of largest component",
                "value": metrics.giant_density[mm]});
        }

        var start_year = new Date(metrics.months[0]).getFullYear(), end_year = new Date(metrics.months[metrics.months.length-1]).getFullYear();
        var the_width = ((end_year - start_year + 1) > 14? 700 : (end_year - start_year + 1) * 50),
            each_width = ((end_year - start_year + 1) > 14? 700 / (end_year - start_year + 1) : 50);
        var timeline_margin = {top: 0, right: 0, bottom: 0, left: 0},
            timeline_width = the_width,
            timeline_height = 40 - timeline_margin.top - timeline_margin.bottom;
        var senttime_timeline_x = d3.time.scale().range([0, timeline_width])
            .domain([new Date(start_year, 0, 1), new Date(end_year, 1, 1)]).nice(); //[new Date(start_year, 1, 1), new Date(end_year, 12, 31)]
        var senttime_timeline_svg = d3.select("#metrics_timeline_svg")
            .attr("width", timeline_width + timeline_margin.left + timeline_margin.right)
            .attr("height", timeline_height + timeline_margin.top + timeline_margin.bottom)
            .style("right", 10 + "px")
          .append("g")
            .attr("transform", "translate(" + timeline_margin.left + "," + timeline_margin.top + ")");
        senttime_timeline_svg.append("rect").attr("x", 0.5).attr("y", 0.2)
            .attr("width", timeline_width - 1.5).attr("height", 27.5)
            .attr("stroke", "#fff").attr("fill", "rgba(0,0,0,0)");
        var senttime_timeline_brush = d3.svg.brush()
            .x(senttime_timeline_x)
            // .on("brush", senttime_timeline_brushed)
            .on("brushend", senttime_timeline_brushedend);

        var formatNumber2 = d3.format(",.3f");
        var senttime_timeline_xAxis= d3.svg.axis().tickSize(28).outerTickSize(0)
            .scale(senttime_timeline_x).ticks(d3.time.years, 1)
            .orient("bottom");
        var senttime_mini_x = senttime_timeline_svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + 0 + ")")
            .call(senttime_timeline_xAxis);
        senttime_mini_x.selectAll("text")
            .attr("x", each_width / 2 - 18).attr("y", 20)
            .attr("dy", null)
            .style("text-anchor", null);


        var ticks = [metrics.months[0], metrics.months[Math.round(metrics.months.length/5)], metrics.months[Math.round(metrics.months.length/5*2)], metrics.months[Math.round(metrics.months.length/5*3)], metrics.months[Math.round(metrics.months.length/5*4)], metrics.months[Math.round(metrics.months.length-1)]]
        var visualization1 = d3plus.viz()
            .container("#centrality_svg") 
            .data({
                "value": centrality_data1, 
                // "opacity": 0.5,
                "stroke": {"width": 1.5}
            })
            .type("line")
            .id("name")  
            .legend({"text": "position_short", "font": {"size": 8}, "title": "position"})
            .color("color")
            .y("value")  
            .x("date") 
            .x({"range": [(new Date(end_year - 2,0,1) < new Date(metrics.months[0])?new Date(metrics.months[0]):new Date(end_year - 2,0,1)), new Date(metrics.months[metrics.months.length-1])]})
            .time("date") 
            .background("rgba(0,0,0,0)")
            .axes({"background": {"color": "rgba(0,0,0,0)"}}) 
            // .y(the_scale == "value"? "volume":(the_scale == "normalized_value"? "normalized_volume":"percentage"))
            .y({"ticks": {"font": {"color": "#fff"}}, "grid": {"color": "#555"}, "label": {"value": "Closeness Centrality", "padding": 10, "font": {"color": "#fff"}}})
            .x({"value": "date", "grid": {"color": "#555"}, "label": {"value": false, "font": {"color": "#fff"}}})
            .x({"ticks": {"font": {"color": "#fff"}}})
            .tooltip(['position', 'type', 'name', 'date'])
            // .font({ "size": 14 })
            .draw(); 

        var visualization2 = d3plus.viz()
            .container("#density_svg") 
            .data({
                "value": density_data,
                "stroke": {"width": 2}
            })
            .type("line")
            .id("type")  
            .text("type")
            .y("value")  
            .x("date")  
            .x({"range": [(new Date(end_year - 2,0,1) < new Date(metrics.months[0])?new Date(metrics.months[0]):new Date(end_year - 2,0,1)), new Date(metrics.months[metrics.months.length-1])]})
            .time("date")
            .color("color")
            .background("rgba(0,0,0,0)")
            .axes({"background": {"color": "rgba(0,0,0,0)"}}) 
            // .y(the_scale == "value"? "volume":(the_scale == "normalized_value"? "normalized_volume":"percentage"))
            .y({"ticks": {"font": {"color": "#fff"}}, "grid": {"color": "#555"}, "label": {"value": "Density", "padding": 10, "font": {"color": "#fff"}}})
            .x({"value": "date", "grid": {"color": "#555"}, "label": {"value": "Time", "padding": 8, "font": {"color": "#fff"}}})
            .x({"ticks": {"font": {"color": "#fff"}}})
            .tooltip(['type', 'date', 'value'])
            // .font({ "size": 14 })
            .draw();

        setTimeout(function(){
            d3.select("#centrality_svg").select("#timeline").style("opacity", 0);
            d3.select("#density_svg").select("#timeline").style("opacity", 0);
            d3.select("#centrality_svg").select("#d3plus_graph_background").style("display", "none");
            d3.select("#density_svg").select("#d3plus_graph_background").style("display", "none");
        }, 500);

        function senttime_timeline_brushedend(){
            var new_end_year = end_year, new_start_year = start_year;
            
            if(!senttime_timeline_brush.empty()){
                new_end_year = senttime_timeline_brush.extent()[1].getFullYear(); new_start_year = senttime_timeline_brush.extent()[0].getFullYear();
                new_end_month = senttime_timeline_brush.extent()[1].getMonth(); new_start_month = senttime_timeline_brush.extent()[0].getMonth();
                senttime_timeline_brush.extent([(new_start_month<6? new Date(new_start_year, 0, 1):new Date(new_start_year+1, 0, 1)), (new_end_month<6? new Date(new_end_year-1, 11, 31):new Date(new_end_year, 11, 31))]);
                senttime_timeline_svg.select("g.metrics_timeline_brush").call(senttime_timeline_brush);

                // d3.select("#centrality_svg").selectAll("*").remove();
                visualization1.x({"range": [senttime_timeline_brush.extent()[0] < new Date(metrics.months[0])? new Date(metrics.months[0]):senttime_timeline_brush.extent()[0], senttime_timeline_brush.extent()[1] > new Date(metrics.months[metrics.months.length-1])? new Date(metrics.months[metrics.months.length-1]):senttime_timeline_brush.extent()[1]]})
                .time("date") 
                .draw();
                visualization2.x({"range": [senttime_timeline_brush.extent()[0] < new Date(metrics.months[0])? new Date(metrics.months[0]):senttime_timeline_brush.extent()[0], senttime_timeline_brush.extent()[1] > new Date(metrics.months[metrics.months.length-1])? new Date(metrics.months[metrics.months.length-1]):senttime_timeline_brush.extent()[1]]})
                .draw();
            }
            else{
                visualization1.x({"range": [new Date(metrics.months[0]), new Date(metrics.months[metrics.months.length-1])]})
                .time("date") 
                .draw();
                visualization2.x({"range": [new Date(metrics.months[0]), new Date(metrics.months[metrics.months.length-1])]})
                .draw();
            }
        }
        
        var brush_x_grab = senttime_timeline_svg.append("g")
                .attr("class", "metrics_timeline_brush")
                .attr("transform", "translate(0, -" + 0 + ")")
                .call(senttime_timeline_brush);
        setTimeout(function(){
            senttime_timeline_brush.extent(
                [(new Date(end_year - 2,0,1) < new Date(metrics.months[0]) ? new Date(metrics.months[0]) : new Date(end_year - 2,0,1)),
                new Date(end_year, 11, 31)]
            );
        }, 500);
        brush_x_grab.selectAll("rect").attr("height", 28);

        d3.select("#metrics_time_pattern_switch").select("#by_closeness").on("click", function(){
            metrics_current_data = "closeness";
            d3.select("#metrics_time_pattern_switch").select("#by_closeness").style("background-color", "rgba(184,184,184,1)");
            d3.select("#metrics_time_pattern_switch").select("#by_betweenness").style("background-color", "rgba(184,184,184,0)");
            d3.select("#metrics_time_pattern_switch").select("#by_degree").style("background-color", "rgba(184,184,184,0)");

            d3.select("#centrality_svg").selectAll("*").remove();
            visualization1 = d3plus.viz()
                .container("#centrality_svg") 
                .data({
                    "value": centrality_data1, 
                    // "opacity": 0.5,
                    "stroke": {"width": 1.5}
                })
                .type("line")
                .id("name")  
                .legend({"text": "position_short", "font": {"size": 8}})
                .color("color")
                .y("value")  
                .x("date") 
                .x({"range": senttime_timeline_brush.empty()? [new Date(metrics.months[0]), new Date(metrics.months[metrics.months.length-1])]:[senttime_timeline_brush.extent()[0] < new Date(metrics.months[0])? new Date(metrics.months[0]):senttime_timeline_brush.extent()[0], senttime_timeline_brush.extent()[1] > new Date(metrics.months[metrics.months.length-1])? new Date(metrics.months[metrics.months.length-1]):senttime_timeline_brush.extent()[1]]})
                .time("date") 
                .background("rgba(0,0,0,0)")
                .axes({"background": {"color": "rgba(0,0,0,0)"}}) 
                // .y(the_scale == "value"? "volume":(the_scale == "normalized_value"? "normalized_volume":"percentage"))
                .y({"ticks": {"font": {"color": "#fff"}}, "grid": {"color": "#555"}, "label": {"value": "Closeness Centrality", "padding": 10, "font": {"color": "#fff"}}})
                .x({"value": "date", "grid": {"color": "#555"}, "label": {"value": false, "font": {"color": "#fff"}}})
                .x({"ticks": {"font": {"color": "#fff"}}})
                .tooltip(['position', 'type', 'name', 'date'])
                // .font({ "size": 14 })
                .draw();

            setTimeout(function(){
                d3.select("#centrality_svg").select("#timeline").style("opacity", 0);
                d3.select("#centrality_svg").select("#d3plus_graph_background").style("display", "none");
            }, 500);
        });
        d3.select("#metrics_time_pattern_switch").select("#by_betweenness").on("click", function(){
            metrics_current_data = "betweenness";
            d3.select("#metrics_time_pattern_switch").select("#by_closeness").style("background-color", "rgba(184,184,184,0)");
            d3.select("#metrics_time_pattern_switch").select("#by_betweenness").style("background-color", "rgba(184,184,184,1)");
            d3.select("#metrics_time_pattern_switch").select("#by_degree").style("background-color", "rgba(184,184,184,0)");

            d3.select("#centrality_svg").selectAll("*").remove();
            visualization1 = d3plus.viz()
                .container("#centrality_svg") 
                .data({
                    "value": centrality_data2, 
                    // "opacity": 0.5,
                    "stroke": {"width": 1.5}
                })
                .type("line")
                .id("name")  
                .legend({"text": "position_short", "font": {"size": 8}})
                .color("color")
                .y("value")  
                .x("date") 
                .x({"range": senttime_timeline_brush.empty()? [new Date(metrics.months[0]), new Date(metrics.months[metrics.months.length-1])]:[senttime_timeline_brush.extent()[0] < new Date(metrics.months[0])? new Date(metrics.months[0]):senttime_timeline_brush.extent()[0], senttime_timeline_brush.extent()[1] > new Date(metrics.months[metrics.months.length-1])? new Date(metrics.months[metrics.months.length-1]):senttime_timeline_brush.extent()[1]]})
                .time("date") 
                .background("rgba(0,0,0,0)")
                .axes({"background": {"color": "rgba(0,0,0,0)"}}) 
                // .y(the_scale == "value"? "volume":(the_scale == "normalized_value"? "normalized_volume":"percentage"))
                .y({"ticks": {"font": {"color": "#fff"}}, "grid": {"color": "#555"}, "label": {"value": "Betweenness Centrality", "padding": 10, "font": {"color": "#fff"}}})
                .x({"value": "date", "grid": {"color": "#555"}, "label": {"value": false, "font": {"color": "#fff"}}})
                .x({"ticks": {"font": {"color": "#fff"}}})
                .tooltip(['position', 'type', 'name', 'date'])
                // .font({ "size": 14 })
                .draw();

            setTimeout(function(){
                d3.select("#centrality_svg").select("#timeline").style("opacity", 0);
                d3.select("#centrality_svg").select("#d3plus_graph_background").style("display", "none");
            }, 500);
        });
        d3.select("#metrics_time_pattern_switch").select("#by_degree").on("click", function(){
            metrics_current_data = "degree";
            d3.select("#metrics_time_pattern_switch").select("#by_closeness").style("background-color", "rgba(184,184,184,0)");
            d3.select("#metrics_time_pattern_switch").select("#by_betweenness").style("background-color", "rgba(184,184,184,0)");
            d3.select("#metrics_time_pattern_switch").select("#by_degree").style("background-color", "rgba(184,184,184,1)");

            d3.select("#centrality_svg").selectAll("*").remove();
            visualization1 = d3plus.viz()
                .container("#centrality_svg") 
                .data({
                    "value": centrality_data3, 
                    // "opacity": 0.5,
                    "stroke": {"width": 1.5}
                })
                .type("line")
                .id("name")  
                .legend({"text": "position_short", "font": {"size": 8}})
                .color("color")
                .y("value")  
                .x("date") 
                .x({"range": senttime_timeline_brush.empty()? [new Date(metrics.months[0]), new Date(metrics.months[metrics.months.length-1])]:[senttime_timeline_brush.extent()[0] < new Date(metrics.months[0])? new Date(metrics.months[0]):senttime_timeline_brush.extent()[0], senttime_timeline_brush.extent()[1] > new Date(metrics.months[metrics.months.length-1])? new Date(metrics.months[metrics.months.length-1]):senttime_timeline_brush.extent()[1]]})
                .time("date") 
                .background("rgba(0,0,0,0)")
                .axes({"background": {"color": "rgba(0,0,0,0)"}}) 
                // .y(the_scale == "value"? "volume":(the_scale == "normalized_value"? "normalized_volume":"percentage"))
                .y({"ticks": {"font": {"color": "#fff"}}, "grid": {"color": "#555"}, "label": {"value": "Degree Centrality", "padding": 10, "font": {"color": "#fff"}}})
                .x({"value": "date", "grid": {"color": "#555"}, "label": {"value": false, "font": {"color": "#fff"}}})
                .x({"ticks": {"font": {"color": "#fff"}}})
                .tooltip(['position', 'type', 'name', 'date'])
                // .font({ "size": 14 })
                .draw();

            setTimeout(function(){
                d3.select("#centrality_svg").select("#timeline").style("opacity", 0);
                d3.select("#centrality_svg").select("#d3plus_graph_background").style("display", "none");
            }, 500);
        });
    }
};

var show_survey_results = function(){
    var colors = ['rgb(171, 43, 43)', 'rgb(27, 70, 108)'];
    var color = d3.scale.category10().range(colors);

    var selectData = [];
    for(var k = 0; k < usersinfo.length; k++){
        selectData.push({"text": (demo == 1? demo_people_names_match[usersinfo[k]['name']]:usersinfo[k]['name'])});
    }
    selectData.push({"text": "All"});
    //add reset button

    var memberInput = d3.select("#surveySelect").select("ul")
    .selectAll('li')
      .data(selectData)
      .enter().append('li').attr("class", "for_checkbox")
      .html(function(d, i){ return '<input type="checkbox" id="new_checkbox' +  i + '" value="' + d.text + '"/><label for="new_checkbox' + i + '"></label><div class="color_set">'+ d.text + '</div>';});
      // .html(function(d, i){ return '<input type="checkbox" value="' + d.text + '"/>' + d.text;});
    // memberInput.append("input").attr("type", "checkbox")  
    //   .attr('value', function (d) { return d.text; });
    document.getElementById('items').getElementsByTagName("input")[0].checked = true;
    var checkList = document.getElementById('surveySelect');
    var items = document.getElementById('items');
    var the_members = items.getElementsByTagName("input");
    for(var k = 0; k < the_members.length; k++){
        the_members[k].onchange = function (){
            var member = this;
            if(member.value == "All"){
                if(member.checked){
                    var the_members = document.getElementById('items').getElementsByTagName("input");
                    var the_labels = document.getElementById('items').getElementsByTagName("label");
                    for(var kk = 0; kk < the_members.length; kk++){
                        the_members[kk].checked = true;
                        the_labels[kk].style.backgroundColor = "red";
                    }
                }
                else{
                    var the_members = document.getElementById('items').getElementsByTagName("input");
                    for(var kk = 0; kk < the_members.length; kk++){
                        the_members[kk].checked = false;
                    }
                    the_members[0].checked = true;
                }
            }
            else{ //check if all members are checked, if no, uncheck all
                var checked_list = [];
                var the_members = document.getElementById('items').getElementsByTagName("input");
                for(var kk = 0; kk < the_members.length - 1; kk++){
                    if(the_members[kk].checked == false){
                        the_members[the_members.length - 1].checked = false; 
                    }
                    else{
                        checked_list.push(kk);
                    }
                }
                if(checked_list.length == 0){
                    member.checked = true;
                }
            }
            memberChange();
        };
    }
    
    function EuclideanDistance(the_data){
        var distance = 0;
        for(var kk = 0; kk < the_data[0].length; kk++)
            distance += Math.pow(the_data[0][kk] - the_data[1][kk], 2);
        return Math.sqrt(distance / 5.0);
    }

    function pearsonCorrelation(prefs, p1, p2) {
        var si = [];
        for (var key in prefs[p1]) {
          if (prefs[p2][key]) si.push(key);
        }
        var n = si.length;
        if (n == 0) return 0;
        var sum1 = 0;
        for (var i = 0; i < si.length; i++) sum1 += prefs[p1][si[i]];
        var sum2 = 0;
        for (var i = 0; i < si.length; i++) sum2 += prefs[p2][si[i]];
        var sum1Sq = 0;
        for (var i = 0; i < si.length; i++) {
          sum1Sq += Math.pow(prefs[p1][si[i]], 2);
        }
        var sum2Sq = 0;
        for (var i = 0; i < si.length; i++) {
          sum2Sq += Math.pow(prefs[p2][si[i]], 2);
        }
        var pSum = 0;
        for (var i = 0; i < si.length; i++) {
          pSum += prefs[p1][si[i]] * prefs[p2][si[i]];
        }
        var num = pSum - (sum1 * sum2 / n);
        var den = Math.sqrt((sum1Sq - Math.pow(sum1, 2) / n) *
            (sum2Sq - Math.pow(sum2, 2) / n));
        if (den == 0) return 0; 
        return num / den;
    }

    checkList.getElementsByClassName('anchor')[0].onclick = function (evt) {
        if (items.classList.contains('visible')){
            items.classList.remove('visible');
            items.style.display = "none";
        }
        
        else{
            items.classList.add('visible');
            items.style.display = "block";
        }
    }
    items.onblur = function(evt) {
        items.classList.remove('visible');
    }
    function memberChange() {
        var is_all = 0;
        var checked_index = [];
        var the_members = document.getElementById('items').getElementsByTagName("input");
        for(var k = 0; k < the_members.length; k++){
            if(the_members[k].checked){
                if(the_members[k].value != "All") checked_index.push(k);
                else if(the_members[k].checked){ 
                    is_all = 1;
                    var the_labels = document.getElementById('items').getElementsByTagName("label");
                    for(var kk = 0; kk < the_labels.length; kk++){
                        the_labels[kk].style.backgroundColor = "#fff";
                    }
                }
            }
        }
        
        if(checked_index.length == 1){
            // var the_labels = document.getElementById('items').getElementsByTagName("label");
            // for(var kk = 0; kk < the_labels.length; kk++){
            //     the_labels[kk].style.backgroundColor = "#fff";
            // }
            var viz1 = d3.select("#analysis_survey_cover").select("#radar1");
            var one_member = d3.select("#analysis_survey_cover").select("#radarmember");
            var viz2 = d3.select("#analysis_survey_cover").select("#radar2");

            if('personality' in personalities[checked_index[0]]){
                var sample_data1 = [
                    {"type": "personality", "name": "CI(95%)", "dimension": "Extra..", "value": parseFloat(ci_personality['Extraversion'][1])},
                    {"type": "personality", "name": "CI(95%)", "dimension": "Agree..", "value": parseFloat(ci_personality['Agreeableness'][1])},
                    {"type": "personality", "name": "CI(95%)", "dimension": "Neg-Emo..", "value": parseFloat(ci_personality['Negative Emotionality'][1])},
                    {"type": "personality", "name": "CI(95%)", "dimension": "Open-Mind", "value": parseFloat(ci_personality['Open-Mindedness'][1])},
                    {"type": "personality", "name": "CI(95%)", "dimension": "Conscie..", "value": parseFloat(ci_personality['Conscientiousness'][1])},
                    {"type": "personality", "name": "Average", "dimension": "Extra..", "value": parseFloat(average_personality['Extraversion'])},
                    {"type": "personality", "name": "Average", "dimension": "Agree..", "value": parseFloat(average_personality['Agreeableness'])},
                    {"type": "personality", "name": "Average", "dimension": "Neg-Emo..", "value": parseFloat(average_personality['Negative Emotionality'])},
                    {"type": "personality", "name": "Average", "dimension": "Open-Mind", "value": parseFloat(average_personality['Open-Mindedness'])},
                    {"type": "personality", "name": "Average", "dimension": "Conscie..", "value": parseFloat(average_personality['Conscientiousness'])},
                    {"type": "personality", "name": "CI(-95%)", "dimension": "Extra..", "value": parseFloat(ci_personality['Extraversion'][0])},
                    {"type": "personality", "name": "CI(-95%)", "dimension": "Agree..", "value": parseFloat(ci_personality['Agreeableness'][0])},
                    {"type": "personality", "name": "CI(-95%)", "dimension": "Neg-Emo..", "value": parseFloat(ci_personality['Negative Emotionality'][0])},
                    {"type": "personality", "name": "CI(-95%)", "dimension": "Open-Mind", "value": parseFloat(ci_personality['Open-Mindedness'][0])},
                    {"type": "personality", "name": "CI(-95%)", "dimension": "Conscie..", "value": parseFloat(ci_personality['Conscientiousness'][0])},
                    {"type": "personality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[0]].name]:usersinfo[checked_index[0]].name), "dimension": "Extra..", "value": parseFloat(personalities[checked_index[0]]['personality']['Extraversion'])},
                    {"type": "personality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[0]].name]:usersinfo[checked_index[0]].name), "dimension": "Agree..", "value": parseFloat(personalities[checked_index[0]]['personality']['Agreeableness'])},
                    {"type": "personality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[0]].name]:usersinfo[checked_index[0]].name), "dimension": "Neg-Emo..", "value": parseFloat(personalities[checked_index[0]]['personality']['Negative Emotionality'])},
                    {"type": "personality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[0]].name]:usersinfo[checked_index[0]].name), "dimension": "Open-Mind", "value": parseFloat(personalities[checked_index[0]]['personality']['Open-Mindedness'])},
                    {"type": "personality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[0]].name]:usersinfo[checked_index[0]].name), "dimension": "Conscie..", "value": parseFloat(personalities[checked_index[0]]['personality']['Conscientiousness'])}
                    
                  ];
            }
            else{
               var sample_data1 = [
                    {"type": "personality", "name": "CI(95%)", "dimension": "Extra..", "value": parseFloat(ci_personality['Extraversion'][1])},
                    {"type": "personality", "name": "CI(95%)", "dimension": "Agree..", "value": parseFloat(ci_personality['Agreeableness'][1])},
                    {"type": "personality", "name": "CI(95%)", "dimension": "Neg-Emo..", "value": parseFloat(ci_personality['Negative Emotionality'][1])},
                    {"type": "personality", "name": "CI(95%)", "dimension": "Open-Mind", "value": parseFloat(ci_personality['Open-Mindedness'][1])},
                    {"type": "personality", "name": "CI(95%)", "dimension": "Conscie..", "value": parseFloat(ci_personality['Conscientiousness'][1])},
                    {"type": "personality", "name": "Average", "dimension": "Extra..", "value": parseFloat(average_personality['Extraversion'])},
                    {"type": "personality", "name": "Average", "dimension": "Agree..", "value": parseFloat(average_personality['Agreeableness'])},
                    {"type": "personality", "name": "Average", "dimension": "Neg-Emo..", "value": parseFloat(average_personality['Negative Emotionality'])},
                    {"type": "personality", "name": "Average", "dimension": "Open-Mind", "value": parseFloat(average_personality['Open-Mindedness'])},
                    {"type": "personality", "name": "Average", "dimension": "Conscie..", "value": parseFloat(average_personality['Conscientiousness'])},
                    {"type": "personality", "name": "CI(-95%)", "dimension": "Extra..", "value": parseFloat(ci_personality['Extraversion'][0])},
                    {"type": "personality", "name": "CI(-95%)", "dimension": "Agree..", "value": parseFloat(ci_personality['Agreeableness'][0])},
                    {"type": "personality", "name": "CI(-95%)", "dimension": "Neg-Emo..", "value": parseFloat(ci_personality['Negative Emotionality'][0])},
                    {"type": "personality", "name": "CI(-95%)", "dimension": "Open-Mind", "value": parseFloat(ci_personality['Open-Mindedness'][0])},
                    {"type": "personality", "name": "CI(-95%)", "dimension": "Conscie..", "value": parseFloat(ci_personality['Conscientiousness'][0])},
                    {"type": "personality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[0]].name]:usersinfo[checked_index[0]].name), "dimension": "Extra..", "value": 0},
                    {"type": "personality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[0]].name]:usersinfo[checked_index[0]].name), "dimension": "Agree..", "value": 0},
                    {"type": "personality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[0]].name]:usersinfo[checked_index[0]].name), "dimension": "Neg-Emo..", "value": 0},
                    {"type": "personality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[0]].name]:usersinfo[checked_index[0]].name), "dimension": "Open-Mind", "value": 0},
                    {"type": "personality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[0]].name]:usersinfo[checked_index[0]].name), "dimension": "Conscie..", "value": 0}
                    
                  ]; 
            }

            if('Harm' in moralities[checked_index[0]]){
                var sample_data2 = [
                    {"type": "morality", "name": "CI(95%)", "dimension": "Fairness", "value": parseFloat(ci_morality['Fairness'][1])},
                    {"type": "morality", "name": "CI(95%)", "dimension": "Harm", "value": parseFloat(ci_morality['Harm'][1])},
                    {"type": "morality", "name": "CI(95%)", "dimension": "Loyalty", "value": parseFloat(ci_morality['Loyalty'][1])},
                    {"type": "morality", "name": "CI(95%)", "dimension": "Authority", "value": parseFloat(ci_morality['Authority'][1])},
                    {"type": "morality", "name": "CI(95%)", "dimension": "Purity", "value": parseFloat(ci_morality['Purity'][1])},
                    {"type": "morality", "name": "Average", "dimension": "Fairness", "value": parseFloat(average_morality['Fairness'])},
                    {"type": "morality", "name": "Average", "dimension": "Harm", "value": parseFloat(average_morality['Harm'])},
                    {"type": "morality", "name": "Average", "dimension": "Loyalty", "value": parseFloat(average_morality['Loyalty'])},
                    {"type": "morality", "name": "Average", "dimension": "Authority", "value": parseFloat(average_morality['Authority'])},
                    {"type": "morality", "name": "Average", "dimension": "Purity", "value": parseFloat(average_morality['Purity'])},
                    {"type": "morality", "name": "CI(-95%)", "dimension": "Fairness", "value": parseFloat(ci_morality['Fairness'][0])},
                    {"type": "morality", "name": "CI(-95%)", "dimension": "Harm", "value": parseFloat(ci_morality['Harm'][0])},
                    {"type": "morality", "name": "CI(-95%)", "dimension": "Loyalty", "value": parseFloat(ci_morality['Loyalty'][0])},
                    {"type": "morality", "name": "CI(-95%)", "dimension": "Authority", "value": parseFloat(ci_morality['Authority'][0])},
                    {"type": "morality", "name": "CI(-95%)", "dimension": "Purity", "value": parseFloat(ci_morality['Purity'][0])},
                    {"type": "morality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[0]].name]:usersinfo[checked_index[0]].name), "dimension": "Fairness", "value": parseFloat(moralities[checked_index[0]]['Fairness'])}, //personalities[p]['morality']['Fairness']
                    {"type": "morality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[0]].name]:usersinfo[checked_index[0]].name), "dimension": "Harm", "value": parseFloat(moralities[checked_index[0]]['Harm'])}, //personalities[p]['morality']['Harm']
                    {"type": "morality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[0]].name]:usersinfo[checked_index[0]].name), "dimension": "Loyalty", "value": parseFloat(moralities[checked_index[0]]['Loyalty'])}, //personalities[p]['morality']['Loyalty']
                    {"type": "morality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[0]].name]:usersinfo[checked_index[0]].name), "dimension": "Authority", "value": parseFloat(moralities[checked_index[0]]['Authority'])}, //personalities[p]['morality']['Authority']
                    {"type": "morality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[0]].name]:usersinfo[checked_index[0]].name), "dimension": "Purity", "value": parseFloat(moralities[checked_index[0]]['Purity'])} //personalities[p]['morality']['Purity']
                  ];
            }
            else{
                var sample_data2 = [
                    {"type": "morality", "name": "CI(95%)", "dimension": "Fairness", "value": parseFloat(ci_morality['Fairness'][1])},
                    {"type": "morality", "name": "CI(95%)", "dimension": "Harm", "value": parseFloat(ci_morality['Harm'][1])},
                    {"type": "morality", "name": "CI(95%)", "dimension": "Loyalty", "value": parseFloat(ci_morality['Loyalty'][1])},
                    {"type": "morality", "name": "CI(95%)", "dimension": "Authority", "value": parseFloat(ci_morality['Authority'][1])},
                    {"type": "morality", "name": "CI(95%)", "dimension": "Purity", "value": parseFloat(ci_morality['Purity'][1])},
                    {"type": "morality", "name": "Average", "dimension": "Fairness", "value": parseFloat(average_morality['Fairness'])},
                    {"type": "morality", "name": "Average", "dimension": "Harm", "value": parseFloat(average_morality['Harm'])},
                    {"type": "morality", "name": "Average", "dimension": "Loyalty", "value": parseFloat(average_morality['Loyalty'])},
                    {"type": "morality", "name": "Average", "dimension": "Authority", "value": parseFloat(average_morality['Authority'])},
                    {"type": "morality", "name": "Average", "dimension": "Purity", "value": parseFloat(average_morality['Purity'])},
                    {"type": "morality", "name": "CI(-95%)", "dimension": "Fairness", "value": parseFloat(ci_morality['Fairness'][0])},
                    {"type": "morality", "name": "CI(-95%)", "dimension": "Harm", "value": parseFloat(ci_morality['Harm'][0])},
                    {"type": "morality", "name": "CI(-95%)", "dimension": "Loyalty", "value": parseFloat(ci_morality['Loyalty'][0])},
                    {"type": "morality", "name": "CI(-95%)", "dimension": "Authority", "value": parseFloat(ci_morality['Authority'][0])},
                    {"type": "morality", "name": "CI(-95%)", "dimension": "Purity", "value": parseFloat(ci_morality['Purity'][0])},
                    {"type": "morality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[0]].name]:usersinfo[checked_index[0]].name), "dimension": "Fairness", "value": 0}, //personalities[p]['morality']['Fairness']
                    {"type": "morality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[0]].name]:usersinfo[checked_index[0]].name), "dimension": "Harm", "value": 0}, //personalities[p]['morality']['Harm']
                    {"type": "morality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[0]].name]:usersinfo[checked_index[0]].name), "dimension": "Loyalty", "value": 0}, //personalities[p]['morality']['Loyalty']
                    {"type": "morality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[0]].name]:usersinfo[checked_index[0]].name), "dimension": "Authority", "value": 0}, //personalities[p]['morality']['Authority']
                    {"type": "morality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[0]].name]:usersinfo[checked_index[0]].name), "dimension": "Purity", "value": 0} //personalities[p]['morality']['Purity']
                  ];
            }
            visualization1.data(sample_data1)
                .draw();
            visualization2.data(sample_data2)
                .draw();

            top_layer.select(".userpic_circle_survey")
                .attr("src", photo(usersinfo[checked_index[0]].name));
            top_layer.select(".person_name_survey")
                .html(function(){
                    if(demo == 0 || demo == null)
                        return (demo == 1? demo_people_names_match[usersinfo[checked_index[0]].name]:usersinfo[checked_index[0]].name);
                    else{
                        return demo_people_names_match[usersinfo[checked_index[0]].name];
                    }
                });

            var demographic_div = one_member.select(".member_demographic");
            demographic_div.selectAll("*").remove();
            if('demographics' in personalities[checked_index[0]]){
                demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_gender").html('<div class="the_header">Gender: </div><div class="the_content">' 
                    + (personalities[checked_index[0]]['demographics']['gender'] == 'f'? 'Female' : (personalities[checked_index[0]]['demographics']['gender'] == 'm'? 'Male' : 'N/A')) + '</div>');
                demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_age").html('<div class="the_header">Age: </div><div class="the_content">' + personalities[checked_index[0]]['demographics']['age'] + '</div>');
                demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_nationality").html('<div class="the_header">Nationality: </div><div class="the_content">' + ('nationality' in demographics[checked_index[0]] ? (demo == 1 ? "XXX": demographics[checked_index[0]]['nationality']) : 'NA') + '</div>');
                demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_ethnicity").html('<div class="the_header">Ethnicity: </div><div class="the_content">' + ('ethnicity' in demographics[checked_index[0]] ? (demo == 1 ? "XXX": demographics[checked_index[0]]['ethnicity']) : 'NA') + '</div>');
                demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_languages").html('<div class="the_header">Languages: </div><div class="the_content">' + ('languages' in demographics[checked_index[0]] ? (demo == 1 ? "XXX": demographics[checked_index[0]]['languages'].join(', ')) : 'NA') + '</div>');
                demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_position").html('<div class="the_header">Position: </div><div class="the_content">' + ('position' in demographics[checked_index[0]] ? demographics[checked_index[0]]['position'] : 'NA') + '</div>');
                demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_academic_degree").html('<div class="the_header">Academic degree: </div><div class="the_content">' + ('degree' in demographics[checked_index[0]] ? demographics[checked_index[0]]['degree'] : 'NA') + '</div>');
                demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_college_major").html('<div class="the_header">Major (college): </div><div class="the_content">' + ('major_college' in demographics[checked_index[0]] ? demographics[checked_index[0]]['major_college'] : 'NA') + '</div>');
                demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_graduate_major").html('<div class="the_header">Major (graduate): </div><div class="the_content">' + ('major_graduate' in demographics[checked_index[0]] ? demographics[checked_index[0]]['major_graduate'] : 'NA') + '</div>');
            }

            setTimeout(function(){ 
                var the_members = document.getElementById('items').getElementsByTagName("input");
                var the_labels = document.getElementById('items').getElementsByTagName("label");
                for(var kk = 0; kk < the_labels.length; kk++){
                    the_labels[kk].style.backgroundColor = "#fff";
                }
                var nn = 3;
                the_labels[checked_index[0]].style.backgroundColor = d3.select("#radar1").selectAll("path")[0][nn].getAttribute("fill");
            }, 800);
            setTimeout(function(){ 
                d3.select("#radar1").select("#d3plus_group_Average_radial").style("opacity", 0.4).select("path").style("fill", "rgb(230,230,230)");
                d3.select("#radar1").select("#d3plus_group_CI95_radial").style("opacity", 0.4).select("path").style("fill", "rgb(230,230,230)");
                d3.select("#radar1").select("#d3plus_group_CI-95_radial").style("opacity", 0.4).select("path").style("fill", "rgb(230,230,230)");
                d3.select("#radar2").select("#d3plus_group_Average_radial").style("opacity", 0.4).select("path").attr("fill", "rgb(230,230,230)");
                d3.select("#radar2").select("#d3plus_group_CI95_radial").style("opacity", 0.4).select("path").attr("fill", "rgb(230,230,230)");
                d3.select("#radar2").select("#d3plus_group_CI-95_radial").style("opacity", 0.4).select("path").attr("fill", "rgb(230,230,230)");
            }, 800);

            one_member.select(".member_similarity").style("opacity", 1);
            var similarity = one_member.select(".member_similarity");
            var sim_personality = similarity.select("#similarity_personality");
            var sim_morality = similarity.select("#similarity_morality");
            sim_personality.select("#similarity_personality_list").selectAll("*").remove();
            sim_morality.select("#similarity_morality_list").selectAll("*").remove();
            
            var personality_similarity = [], morality_similarity = [];
            for(var kk = 0; kk < usersinfo.length; kk++){
                if(checked_index[0] != kk){
                    var similarity_score = 0, similarity_score2 = 0;
                    // var mag1 = 0; mag2 = 0, mag3 = 0, mag4 = 0;
                    var dd1 = [], dd2 = [], dd3 = [], dd4 = [];
                    if('personality' in personalities[checked_index[0]]){
                        for(var key in personalities[kk]['personality']){
                            dd1.push(personalities[checked_index[0]]['personality'][key] / 100.0);
                            dd2.push(personalities[kk]['personality'][key] / 100.0);
                        }
                    }
                    if('personality' in personalities[checked_index[0]] && 'Open-Mindedness' in personalities[checked_index[0]]['personality'] && 'personality' in personalities[kk] && 'Open-Mindedness' in personalities[kk]['personality']){ 
                        var this_data = new Array(
                            dd1, dd2
                        );
                        // similarity_score = pearsonCorrelation(this_data,0,1);
                        similarity_score = EuclideanDistance(this_data);
                        personality_similarity.push([usersinfo[kk].name, similarity_score]);
                    }
                    // // similarity_score /= 5.0; similarity_score = Math.sqrt(similarity_score); //euclidean distance
                    // if('personality' in personalities[checked_index[0]] && 'Open-Mindedness' in personalities[checked_index[0]]['personality'] && 'personality' in personalities[kk] && 'Open-Mindedness' in personalities[kk]['personality']){ 
                    //     similarity_score = similarity_score / (Math.sqrt(mag1) * Math.sqrt(mag2));
                    //     personality_similarity.push([usersinfo[kk].name, similarity_score]);
                    // }

                    for(var key in moralities[kk]){
                        // similarity_score2 += Math.pow((moralities[kk][key] - moralities[t][key]) / 5.0, 2);
                        similarity_score2 += (moralities[kk][key] * moralities[checked_index[0]][key]);
                        dd3.push(moralities[checked_index[0]][key] / 5.0);
                        dd4.push(moralities[kk][key] / 5.0);
                    }
                    if('Harm' in moralities[checked_index[0]] && 'Harm' in moralities[kk]){
                        var this_data2 = new Array(
                            dd3, dd4
                        );
                        // similarity_score2 = pearsonCorrelation(this_data2,0,1);
                        similarity_score2 = EuclideanDistance(this_data2);
                        morality_similarity.push([usersinfo[kk].name, similarity_score2]);
                    }
                    // // similarity_score2 /= 5.0; similarity_score2 = Math.sqrt(similarity_score2);
                    // if('Harm' in moralities[checked_index[0]] && 'Harm' in moralities[kk]){
                    //     similarity_score2 = similarity_score2 / (Math.sqrt(mag3) * Math.sqrt(mag4));
                    //     morality_similarity.push([usersinfo[kk].name, similarity_score2]);
                    // }
                }
            }
            personality_similarity.sort(function (a, b) {
                return a[1] - b[1];
            });
            morality_similarity.sort(function (a, b) {
                return a[1] - b[1];
            });
            d3.range(personality_similarity.length).forEach(function(l){
                sim_personality.select("#similarity_personality_list").append("div").attr("class", "one_similarity").html(((l + 1) < 10? "&nbsp;":"") + (l + 1) + "&nbsp;" + (demo == 1? demo_people_names_match[personality_similarity[l][0]]:personality_similarity[l][0]) + " (" + personality_similarity[l][1].toFixed(3) + ")");
            });
            d3.range(morality_similarity.length).forEach(function(l){
                sim_morality.select("#similarity_morality_list").append("div").attr("class", "one_similarity").html(((l + 1) < 10? "&nbsp;":"") + (l + 1) + "&nbsp;" + (demo == 1? demo_people_names_match[morality_similarity[l][0]]:morality_similarity[l][0]) + " (" + morality_similarity[l][1].toFixed(3) + ")");
            });
        }
        else{
            var viz1 = d3.select("#analysis_survey_cover").select("#radar1");
            var one_member = d3.select("#analysis_survey_cover").select("#radarmember");
            var viz2 = d3.select("#analysis_survey_cover").select("#radar2");

            var sample_data1 = [
                {"type": "personality", "name": "CI(95%)", "dimension": "Extra..", "value": parseFloat(ci_personality['Extraversion'][1])},
                {"type": "personality", "name": "CI(95%)", "dimension": "Agree..", "value": parseFloat(ci_personality['Agreeableness'][1])},
                {"type": "personality", "name": "CI(95%)", "dimension": "Neg-Emo..", "value": parseFloat(ci_personality['Negative Emotionality'][1])},
                {"type": "personality", "name": "CI(95%)", "dimension": "Open-Mind", "value": parseFloat(ci_personality['Open-Mindedness'][1])},
                {"type": "personality", "name": "CI(95%)", "dimension": "Conscie..", "value": parseFloat(ci_personality['Conscientiousness'][1])},
                {"type": "personality", "name": "Average", "dimension": "Extra..", "value": parseFloat(average_personality['Extraversion'])},
                {"type": "personality", "name": "Average", "dimension": "Agree..", "value": parseFloat(average_personality['Agreeableness'])},
                {"type": "personality", "name": "Average", "dimension": "Neg-Emo..", "value": parseFloat(average_personality['Negative Emotionality'])},
                {"type": "personality", "name": "Average", "dimension": "Open-Mind", "value": parseFloat(average_personality['Open-Mindedness'])},
                {"type": "personality", "name": "Average", "dimension": "Conscie..", "value": parseFloat(average_personality['Conscientiousness'])},
                {"type": "personality", "name": "CI(-95%)", "dimension": "Extra..", "value": parseFloat(ci_personality['Extraversion'][0])},
                {"type": "personality", "name": "CI(-95%)", "dimension": "Agree..", "value": parseFloat(ci_personality['Agreeableness'][0])},
                {"type": "personality", "name": "CI(-95%)", "dimension": "Neg-Emo..", "value": parseFloat(ci_personality['Negative Emotionality'][0])},
                {"type": "personality", "name": "CI(-95%)", "dimension": "Open-Mind", "value": parseFloat(ci_personality['Open-Mindedness'][0])},
                {"type": "personality", "name": "CI(-95%)", "dimension": "Conscie..", "value": parseFloat(ci_personality['Conscientiousness'][0])}
            ], 
            sample_data2 = [
                {"type": "morality", "name": "CI(95%)", "dimension": "Fairness", "value": parseFloat(ci_morality['Fairness'][1])},
                {"type": "morality", "name": "CI(95%)", "dimension": "Harm", "value": parseFloat(ci_morality['Harm'][1])},
                {"type": "morality", "name": "CI(95%)", "dimension": "Loyalty", "value": parseFloat(ci_morality['Loyalty'][1])},
                {"type": "morality", "name": "CI(95%)", "dimension": "Authority", "value": parseFloat(ci_morality['Authority'][1])},
                {"type": "morality", "name": "CI(95%)", "dimension": "Purity", "value": parseFloat(ci_morality['Purity'][1])},
                {"type": "morality", "name": "Average", "dimension": "Fairness", "value": parseFloat(average_morality['Fairness'])},
                {"type": "morality", "name": "Average", "dimension": "Harm", "value": parseFloat(average_morality['Harm'])},
                {"type": "morality", "name": "Average", "dimension": "Loyalty", "value": parseFloat(average_morality['Loyalty'])},
                {"type": "morality", "name": "Average", "dimension": "Authority", "value": parseFloat(average_morality['Authority'])},
                {"type": "morality", "name": "Average", "dimension": "Purity", "value": parseFloat(average_morality['Purity'])},
                {"type": "morality", "name": "CI(-95%)", "dimension": "Fairness", "value": parseFloat(ci_morality['Fairness'][0])},
                {"type": "morality", "name": "CI(-95%)", "dimension": "Harm", "value": parseFloat(ci_morality['Harm'][0])},
                {"type": "morality", "name": "CI(-95%)", "dimension": "Loyalty", "value": parseFloat(ci_morality['Loyalty'][0])},
                {"type": "morality", "name": "CI(-95%)", "dimension": "Authority", "value": parseFloat(ci_morality['Authority'][0])},
                {"type": "morality", "name": "CI(-95%)", "dimension": "Purity", "value": parseFloat(ci_morality['Purity'][0])}
            ];
            for(var t = 0; t < checked_index.length; t++){
                if('personality' in personalities[checked_index[t]]){
                    sample_data1.push(
                        {"type": "personality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[t]].name]:usersinfo[checked_index[t]].name), "dimension": "Extra..", "value": parseInt(personalities[checked_index[t]]['personality']['Extraversion'])},
                        {"type": "personality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[t]].name]:usersinfo[checked_index[t]].name), "dimension": "Agree..", "value": parseInt(personalities[checked_index[t]]['personality']['Agreeableness'])},
                        {"type": "personality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[t]].name]:usersinfo[checked_index[t]].name), "dimension": "Neg-Emo..", "value": parseInt(personalities[checked_index[t]]['personality']['Negative Emotionality'])},
                        {"type": "personality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[t]].name]:usersinfo[checked_index[t]].name), "dimension": "Open-Mind", "value": parseInt(personalities[checked_index[t]]['personality']['Open-Mindedness'])},
                        {"type": "personality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[t]].name]:usersinfo[checked_index[t]].name), "dimension": "Conscie..", "value": parseInt(personalities[checked_index[t]]['personality']['Conscientiousness'])}
                      );
                }
                else{
                    sample_data1.push(
                        {"type": "personality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[t]].name]:usersinfo[checked_index[t]].name), "dimension": "Extra..", "value": 0},
                        {"type": "personality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[t]].name]:usersinfo[checked_index[t]].name), "dimension": "Agree..", "value": 0},
                        {"type": "personality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[t]].name]:usersinfo[checked_index[t]].name), "dimension": "Neg-Emo..", "value": 0},
                        {"type": "personality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[t]].name]:usersinfo[checked_index[t]].name), "dimension": "Open-Mind", "value": 0},
                        {"type": "personality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[t]].name]:usersinfo[checked_index[t]].name), "dimension": "Conscie..", "value": 0}
                      );
                }
                if('Harm' in moralities[checked_index[t]]){
                    sample_data2.push(
                        {"type": "morality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[t]].name]:usersinfo[checked_index[t]].name), "dimension": "Fairness", "value": parseFloat(moralities[checked_index[t]]['Fairness'])}, //personalities[p]['morality']['Fairness']
                        {"type": "morality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[t]].name]:usersinfo[checked_index[t]].name), "dimension": "Harm", "value": parseFloat(moralities[checked_index[t]]['Harm'])}, //personalities[p]['morality']['Harm']
                        {"type": "morality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[t]].name]:usersinfo[checked_index[t]].name), "dimension": "Loyalty", "value": parseFloat(moralities[checked_index[t]]['Loyalty'])}, //personalities[p]['morality']['Loyalty']
                        {"type": "morality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[t]].name]:usersinfo[checked_index[t]].name), "dimension": "Authority", "value": parseFloat(moralities[checked_index[t]]['Authority'])}, //personalities[p]['morality']['Authority']
                        {"type": "morality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[t]].name]:usersinfo[checked_index[t]].name), "dimension": "Purity", "value": parseFloat(moralities[checked_index[t]]['Purity'])} //personalities[p]['morality']['Purity']
                      );
                }
                else{
                    sample_data2.push(
                        {"type": "morality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[t]].name]:usersinfo[checked_index[t]].name), "dimension": "Fairness", "value": 0}, //personalities[p]['morality']['Fairness']
                        {"type": "morality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[t]].name]:usersinfo[checked_index[t]].name), "dimension": "Harm", "value": 0}, //personalities[p]['morality']['Harm']
                        {"type": "morality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[t]].name]:usersinfo[checked_index[t]].name), "dimension": "Loyalty", "value": 0}, //personalities[p]['morality']['Loyalty']
                        {"type": "morality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[t]].name]:usersinfo[checked_index[t]].name), "dimension": "Authority", "value": 0}, //personalities[p]['morality']['Authority']
                        {"type": "morality", "name": (demo == 1? demo_people_names_match[usersinfo[checked_index[t]].name]:usersinfo[checked_index[t]].name), "dimension": "Purity", "value": 0} //personalities[p]['morality']['Purity']
                      );
                }
            }
            visualization1.data(sample_data1)
                .draw();
            visualization2.data(sample_data2)
                .draw();

            top_layer.select(".userpic_circle_survey")
                .attr("src", "/static/images/default_team_pic.png");
            top_layer.select(".person_name_survey")
                .html(function(){
                    if(is_all){
                        return "All members";
                    }
                    else{
                        if(demo != 1){
                            var string = usersinfo[checked_index[0]]['given_name'];
                            for(var k = 1; k < checked_index.length; k++){
                                string += " & " + usersinfo[checked_index[k]]['given_name'];
                            }
                        }
                        else{
                            var string = demo_people_names_match[usersinfo[checked_index[0]]['name']];
                            for(var k = 1; k < checked_index.length; k++){
                                string += " & " + demo_people_names_match[usersinfo[checked_index[k]]['name']];
                            }
                        }
                        return string;
                    }
                });

            var demographic_div = one_member.select(".member_demographic");
            demographic_div.selectAll("*").remove();
            if(is_all){
                demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_age").html('<div class="the_header">Ave. age: </div><div class="the_content">' + average_demographics['Age'].toFixed(1) + '</div>');
            }
            else{
                demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_gender").html(function(){
                    var string = ('demographics' in personalities[checked_index[0]] && 'gender' in personalities[checked_index[0]]['demographics']? (personalities[checked_index[0]]['demographics']['gender'] == 'f'? 'Female' : (personalities[checked_index[0]]['demographics']['gender'] == 'm'? 'Male' : 'NA')): 'NA');
                    for(var k = 1; k < checked_index.length; k++){
                        string += " | " + ('demographics' in personalities[checked_index[k]] && 'gender' in personalities[checked_index[k]]['demographics']? (personalities[checked_index[k]]['demographics']['gender'] == 'f'? 'Female' : (personalities[checked_index[k]]['demographics']['gender'] == 'm'? 'Male' : 'NA')):'NA');
                    }
                    return '<div class="the_header">Gender: </div><div class="the_content">' + string + '</div>'
                });
                demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_age").html(function(){
                    var string = ('demographics' in personalities[checked_index[0]] && 'age' in personalities[checked_index[0]]['demographics']? personalities[checked_index[0]]['demographics']['age']: 'NA');
                    for(var k = 1; k < checked_index.length; k++){
                        string += " | " + ('demographics' in personalities[checked_index[k]] && 'age' in personalities[checked_index[k]]['demographics']? personalities[checked_index[k]]['demographics']['age']:'NA');
                    }
                    return '<div class="the_header">Age: </div><div class="the_content">' + string + '</div>';
                });
                demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_nationality").html(function(){
                    var string = ('nationality' in demographics[checked_index[0]]? demographics[checked_index[0]]['nationality']: 'NA');
                    for(var k = 1; k < checked_index.length; k++){
                        string += " | " + ('nationality' in demographics[checked_index[k]]? demographics[checked_index[k]]['nationality']:'NA');
                    }
                    return '<div class="the_header">Nationality: </div><div class="the_content">' + string + '</div>';
                });
                demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_languages").html(function(){
                    var string = ('languages' in demographics[checked_index[0]]? demographics[checked_index[0]]['languages'].join(', '): 'NA');
                    for(var k = 1; k < checked_index.length; k++){
                        string += " | " + ('languages' in demographics[checked_index[k]]? demographics[checked_index[k]]['languages'].join(', '):'NA');
                    }
                    return '<div class="the_header">Languages: </div><div class="the_content">' + string + '</div>';
                });
                demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_position").html(function(){
                    var string = ('position' in demographics[checked_index[0]]? demographics[checked_index[0]]['position']: 'NA');
                    for(var k = 1; k < checked_index.length; k++){
                        string += " | " + ('position' in demographics[checked_index[k]]? demographics[checked_index[k]]['position']:'NA');
                    }
                    return '<div class="the_header">Position: </div><div class="the_content">' + string + '</div>';
                });//
                demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_academic_degree").html(function(){
                    var string = ('degree' in demographics[checked_index[0]]? demographics[checked_index[0]]['degree']: 'NA');
                    for(var k = 1; k < checked_index.length; k++){
                        string += " | " + ('degree' in demographics[checked_index[k]]? demographics[checked_index[k]]['degree']:'NA');
                    }
                    return '<div class="the_header">Academic degree: </div><div class="the_content">' + string + '</div>';
                });
                demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_college_major").html(function(){
                    var string = ('major_college' in demographics[checked_index[0]]? demographics[checked_index[0]]['major_college']: 'NA');
                    for(var k = 1; k < checked_index.length; k++){
                        string += " | " + ('major_college' in demographics[checked_index[k]]? demographics[checked_index[k]]['major_college']:'NA');
                    }
                    return '<div class="the_header">Major (college): </div><div class="the_content">' + string + '</div>';
                });
                demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_graduate_major").html(function(){
                    var string = ('major_graduate' in demographics[checked_index[0]]? demographics[checked_index[0]]['major_graduate']: 'NA');
                    for(var k = 1; k < checked_index.length; k++){
                        string += " | " + ('major_graduate' in demographics[checked_index[k]]? demographics[checked_index[k]]['major_graduate']:'NA');
                    }
                    return '<div class="the_header">Major (graduate): </div><div class="the_content">' + string + '</div>';
                });
            }
            
            setTimeout(function(){ 
                var the_members = document.getElementById('items').getElementsByTagName("input");
                var the_labels = document.getElementById('items').getElementsByTagName("label");
                var nn = 3;
                for(var kk = 0; kk < the_members.length; kk++){
                    if(the_members[kk].checked == true){
                        if(the_members[kk].value != "All"){
                            the_labels[kk].style.backgroundColor = d3.select("#radar1").selectAll("path")[0][nn].getAttribute("fill");
                            nn++;
                        }
                        else the_labels[kk].style.backgroundColor = "#ffff";
                    }
                    else
                        the_labels[kk].style.backgroundColor = "#fff";
                }
            }, 700);

            setTimeout(function(){ 
                d3.select("#radar1").select("#d3plus_group_Average_radial").style("opacity", 0.4).select("path").style("fill", "rgb(230,230,230)");
                d3.select("#radar1").select("#d3plus_group_CI95_radial").style("opacity", 0.4).select("path").style("fill", "rgb(230,230,230)");
                d3.select("#radar1").select("#d3plus_group_CI-95_radial").style("opacity", 0.4).select("path").style("fill", "rgb(230,230,230)");
                d3.select("#radar2").select("#d3plus_group_Average_radial").style("opacity", 0.4).select("path").style("fill", "rgb(230,230,230)");
                d3.select("#radar2").select("#d3plus_group_CI95_radial").style("opacity", 0.4).select("path").style("fill", "rgb(230,230,230)");
                d3.select("#radar2").select("#d3plus_group_CI-95_radial").style("opacity", 0.4).select("path").style("fill", "rgb(230,230,230)");

            }, 800);

            one_member.select(".member_similarity").style("opacity", 0);
        }
    }

    // var memberInput = d3.select("#surveySelect").on('change',memberChange)
    // .selectAll('option')
    //   .data(selectData)
    //   .enter()
    // .append('option')
    //   .attr('value', function (d) { return d.text; })
    //   .text(function (d) { return d.text ;});
    
    // function memberChange() {
    //     var value = this.value;
    //     var t = -1;
    //     for(var k = 0; k < usersinfo.length; k++){
    //         if(usersinfo[k].name == value){ t = k; break;}
    //     }
    //     if(t == -1){//see all
    //         var viz1 = d3.select("#analysis_survey_cover").select("#radar1");
    //         var one_member = d3.select("#analysis_survey_cover").select("#radarmember");
    //         var viz2 = d3.select("#analysis_survey_cover").select("#radar2");

    //         var sample_data1 = [], sample_data2 = [];
    //         for(var t = 0; t < usersinfo.length; t++){
    //             sample_data1.push(
    //                 {"type": "personality", "name": usersinfo[t].name, "dimension": "Extra..", "value": parseInt(personalities[t]['personality']['Extraversion'])},
    //                 {"type": "personality", "name": usersinfo[t].name, "dimension": "Agree..", "value": parseInt(personalities[t]['personality']['Agreeableness'])},
    //                 {"type": "personality", "name": usersinfo[t].name, "dimension": "Neg-Emo..", "value": parseInt(personalities[t]['personality']['Negative Emotionality'])},
    //                 {"type": "personality", "name": usersinfo[t].name, "dimension": "Open-Mind", "value": parseInt(personalities[t]['personality']['Open-Mindedness'])},
    //                 {"type": "personality", "name": usersinfo[t].name, "dimension": "Conscie..", "value": parseInt(personalities[t]['personality']['Conscientiousness'])}
    //               );
    //             sample_data2.push(
    //                 {"type": "morality", "name": usersinfo[t].name, "dimension": "Fairness", "value": 5*t}, //personalities[p]['morality']['Fairness']
    //                 {"type": "morality", "name": usersinfo[t].name, "dimension": "Harm", "value": 20*t}, //personalities[p]['morality']['Harm']
    //                 {"type": "morality", "name": usersinfo[t].name, "dimension": "Loyalty", "value": 30*t}, //personalities[p]['morality']['Loyalty']
    //                 {"type": "morality", "name": usersinfo[t].name, "dimension": "Authority", "value": 5}, //personalities[p]['morality']['Authority']
    //                 {"type": "morality", "name": usersinfo[t].name, "dimension": "Purity", "value": 50} //personalities[p]['morality']['Purity']
    //               );
    //         }
    //         visualization1.data(sample_data1)
    //             .draw();
    //         visualization2.data(sample_data2)
    //             .draw();

    //         top_layer.select(".userpic_circle_survey")
    //             .attr("src", "/static/images/default_team_pic.png");
    //         top_layer.select(".person_name_survey")
    //             .html("All members");

    //         var demographic_div = one_member.select(".member_demographic");
    //         demographic_div.selectAll("*").remove();
    //         // demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_gender").html('<div class="the_header">Gender: </div><div class="the_content">' 
    //         //     + (personalities[t]['demographics']['gender'] == 'f'? 'Female' : (personalities[t]['demographics']['gender'] == 'm'? 'Male' : 'N/A')) + '</div>');
    //         demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_age").html('<div class="the_header">Ave. age: </div><div class="the_content">' + average_demographics['Age'].toFixed(1) + '</div>');
    //         // demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_languages").html('<div class="the_header">Languages: </div><div class="the_content">' + personalities[t]['demographics']['gender'] + '</div>');
    //         // demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_position").html('<div class="the_header">Position: </div><div class="the_content">' + personalities[t]['demographics']['gender'] + '</div>');
    //         // demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_academic_degree").html('<div class="the_header">Academic degree: </div><div class="the_content">' + personalities[t]['demographics']['gender'] + '</div>');
    //         // demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_college_major").html('<div class="the_header">Major (college): </div><div class="the_content">' + personalities[t]['demographics']['gender'] + '</div>');
    //         // demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_graduate_major").html('<div class="the_header">Major (graduate): </div><div class="the_content">' + personalities[t]['demographics']['gender'] + '</div>');
    //     }
    //     else{
    //         var viz1 = d3.select("#analysis_survey_cover").select("#radar1");
    //         var one_member = d3.select("#analysis_survey_cover").select("#radarmember");
    //         var viz2 = d3.select("#analysis_survey_cover").select("#radar2");

    //         var sample_data1 = [
    //             {"type": "personality", "name": "Average", "dimension": "Extra..", "value": parseInt(average_personality['Extraversion'])},
    //             {"type": "personality", "name": "Average", "dimension": "Agree..", "value": parseInt(average_personality['Agreeableness'])},
    //             {"type": "personality", "name": "Average", "dimension": "Neg-Emo..", "value": parseInt(average_personality['Negative Emotionality'])},
    //             {"type": "personality", "name": "Average", "dimension": "Open-Mind", "value": parseInt(average_personality['Open-Mindedness'])},
    //             {"type": "personality", "name": "Average", "dimension": "Conscie..", "value": parseInt(average_personality['Conscientiousness'])},
    //             {"type": "personality", "name": usersinfo[t].name, "dimension": "Extra..", "value": parseInt(personalities[t]['personality']['Extraversion'])},
    //             {"type": "personality", "name": usersinfo[t].name, "dimension": "Agree..", "value": parseInt(personalities[t]['personality']['Agreeableness'])},
    //             {"type": "personality", "name": usersinfo[t].name, "dimension": "Neg-Emo..", "value": parseInt(personalities[t]['personality']['Negative Emotionality'])},
    //             {"type": "personality", "name": usersinfo[t].name, "dimension": "Open-Mind", "value": parseInt(personalities[t]['personality']['Open-Mindedness'])},
    //             {"type": "personality", "name": usersinfo[t].name, "dimension": "Conscie..", "value": parseInt(personalities[t]['personality']['Conscientiousness'])}
                
    //           ];
    //         var sample_data2 = [
    //             {"type": "morality", "name": usersinfo[t].name, "dimension": "Fairness", "value": 50}, //personalities[p]['morality']['Fairness']
    //             {"type": "morality", "name": usersinfo[t].name, "dimension": "Harm", "value": 5}, //personalities[p]['morality']['Harm']
    //             {"type": "morality", "name": usersinfo[t].name, "dimension": "Loyalty", "value": 50}, //personalities[p]['morality']['Loyalty']
    //             {"type": "morality", "name": usersinfo[t].name, "dimension": "Authority", "value": 5}, //personalities[p]['morality']['Authority']
    //             {"type": "morality", "name": usersinfo[t].name, "dimension": "Purity", "value": 50} //personalities[p]['morality']['Purity']
    //           ];
    //         visualization1.data(sample_data1)
    //             .draw();
    //         visualization2.data(sample_data2)
    //             .draw();

    //         top_layer.select(".userpic_circle_survey")
    //             .attr("src", photo(usersinfo[t].name));
    //         top_layer.select(".person_name_survey")
    //             .html(usersinfo[t].name);

    //         var demographic_div = one_member.select(".member_demographic");
    //         demographic_div.selectAll("*").remove();
    //         demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_gender").html('<div class="the_header">Gender: </div><div class="the_content">' 
    //             + (personalities[t]['demographics']['gender'] == 'f'? 'Female' : (personalities[t]['demographics']['gender'] == 'm'? 'Male' : 'N/A')) + '</div>');
    //         demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_age").html('<div class="the_header">Age: </div><div class="the_content">' + personalities[t]['demographics']['age'] + '</div>');
    //         demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_nationality").html('<div class="the_header">Nationality: </div><div class="the_content">' + personalities[t]['demographics']['gender'] + '</div>');
    //         demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_languages").html('<div class="the_header">Languages: </div><div class="the_content">' + personalities[t]['demographics']['gender'] + '</div>');
    //         demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_position").html('<div class="the_header">Position: </div><div class="the_content">' + personalities[t]['demographics']['gender'] + '</div>');
    //         demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_academic_degree").html('<div class="the_header">Academic degree: </div><div class="the_content">' + personalities[t]['demographics']['gender'] + '</div>');
    //         demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_college_major").html('<div class="the_header">Major (college): </div><div class="the_content">' + personalities[t]['demographics']['gender'] + '</div>');
    //         demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_graduate_major").html('<div class="the_header">Major (graduate): </div><div class="the_content">' + personalities[t]['demographics']['gender'] + '</div>');

    //         d3.select("#d3plus_group_Average_radial").style("opacity", 0.5);
    //     }
    // }

    var t = 0;
    var viz1 = d3.select("#analysis_survey_cover").append("div").attr("class", "radar").attr("id", "radar1");
    viz1.append("div").attr("class", "radar_title").text("Personality");
    var one_member = d3.select("#analysis_survey_cover").append("div").attr("id", "radarmember");
    var viz2 = d3.select("#analysis_survey_cover").append("div").attr("class", "radar").attr("id", "radar2");
    viz2.append("div").attr("class", "radar_title").text("Morality");

    var p_margin = {top: 0, right: 10, bottom: 0, left: 10};
    var svg_width = $("#analysis_histo_cover").width() * 0.35, svg_height = svg_width; //$("#analysis_histo_cover").height() * 0.5;
    var p_width = svg_width - p_margin.left - p_margin.right, p_height = svg_height - p_margin.top - p_margin.bottom;
    viz1.style("width", (p_width) + "px").style("height", (p_height) + "px")
        .style("margin-left", (p_margin.left) + "px").style("margin-right", p_margin.right + "px")
        .style("margin-top", (p_margin.top) + "px").style("margin-bottom", (p_margin.bottom) + "px");
    viz2.style("width", (p_width) + "px").style("height", (p_height) + "px")
        .style("margin-left", (p_margin.left) + "px").style("margin-right", p_margin.right + "px")
        .style("margin-top", p_margin.top + "px").style("margin-bottom", (p_margin.bottom) + "px");
    
    if('personality' in personalities[t]){
        var sample_data1 = [
            {"type": "personality", "name": "CI(95%)", "dimension": "Extra..", "value": parseFloat(ci_personality['Extraversion'][1])},
            {"type": "personality", "name": "CI(95%)", "dimension": "Agree..", "value": parseFloat(ci_personality['Agreeableness'][1])},
            {"type": "personality", "name": "CI(95%)", "dimension": "Neg-Emo..", "value": parseFloat(ci_personality['Negative Emotionality'][1])},
            {"type": "personality", "name": "CI(95%)", "dimension": "Open-Mind", "value": parseFloat(ci_personality['Open-Mindedness'][1])},
            {"type": "personality", "name": "CI(95%)", "dimension": "Conscie..", "value": parseFloat(ci_personality['Conscientiousness'][1])},
            {"type": "personality", "name": "Average", "dimension": "Extra..", "value": parseFloat(average_personality['Extraversion'])},
            {"type": "personality", "name": "Average", "dimension": "Agree..", "value": parseFloat(average_personality['Agreeableness'])},
            {"type": "personality", "name": "Average", "dimension": "Neg-Emo..", "value": parseFloat(average_personality['Negative Emotionality'])},
            {"type": "personality", "name": "Average", "dimension": "Open-Mind", "value": parseFloat(average_personality['Open-Mindedness'])},
            {"type": "personality", "name": "Average", "dimension": "Conscie..", "value": parseFloat(average_personality['Conscientiousness'])},
            {"type": "personality", "name": "CI(-95%)", "dimension": "Extra..", "value": parseFloat(ci_personality['Extraversion'][0])},
            {"type": "personality", "name": "CI(-95%)", "dimension": "Agree..", "value": parseFloat(ci_personality['Agreeableness'][0])},
            {"type": "personality", "name": "CI(-95%)", "dimension": "Neg-Emo..", "value": parseFloat(ci_personality['Negative Emotionality'][0])},
            {"type": "personality", "name": "CI(-95%)", "dimension": "Open-Mind", "value": parseFloat(ci_personality['Open-Mindedness'][0])},
            {"type": "personality", "name": "CI(-95%)", "dimension": "Conscie..", "value": parseFloat(ci_personality['Conscientiousness'][0])},
            {"type": "personality", "name": (demo == 1? demo_people_names_match[usersinfo[t].name]:usersinfo[t].name), "dimension": "Extra..", "value": parseFloat(personalities[t]['personality']['Extraversion'])},
            {"type": "personality", "name": (demo == 1? demo_people_names_match[usersinfo[t].name]:usersinfo[t].name), "dimension": "Agree..", "value": parseFloat(personalities[t]['personality']['Agreeableness'])},
            {"type": "personality", "name": (demo == 1? demo_people_names_match[usersinfo[t].name]:usersinfo[t].name), "dimension": "Neg-Emo..", "value": parseFloat(personalities[t]['personality']['Negative Emotionality'])},
            {"type": "personality", "name": (demo == 1? demo_people_names_match[usersinfo[t].name]:usersinfo[t].name), "dimension": "Open-Mind", "value": parseFloat(personalities[t]['personality']['Open-Mindedness'])},
            {"type": "personality", "name": (demo == 1? demo_people_names_match[usersinfo[t].name]:usersinfo[t].name), "dimension": "Conscie..", "value": parseFloat(personalities[t]['personality']['Conscientiousness'])}
          ];
    }
    else{
        var sample_data1 = [
            {"type": "personality", "name": "CI(95%)", "dimension": "Extra..", "value": parseFloat(ci_personality['Extraversion'][1])},
            {"type": "personality", "name": "CI(95%)", "dimension": "Agree..", "value": parseFloat(ci_personality['Agreeableness'][1])},
            {"type": "personality", "name": "CI(95%)", "dimension": "Neg-Emo..", "value": parseFloat(ci_personality['Negative Emotionality'][1])},
            {"type": "personality", "name": "CI(95%)", "dimension": "Open-Mind", "value": parseFloat(ci_personality['Open-Mindedness'][1])},
            {"type": "personality", "name": "CI(95%)", "dimension": "Conscie..", "value": parseFloat(ci_personality['Conscientiousness'][1])},
            {"type": "personality", "name": "Average", "dimension": "Extra..", "value": parseFloat(average_personality['Extraversion'])},
            {"type": "personality", "name": "Average", "dimension": "Agree..", "value": parseFloat(average_personality['Agreeableness'])},
            {"type": "personality", "name": "Average", "dimension": "Neg-Emo..", "value": parseFloat(average_personality['Negative Emotionality'])},
            {"type": "personality", "name": "Average", "dimension": "Open-Mind", "value": parseFloat(average_personality['Open-Mindedness'])},
            {"type": "personality", "name": "Average", "dimension": "Conscie..", "value": parseFloat(average_personality['Conscientiousness'])},
            {"type": "personality", "name": "CI(-95%)", "dimension": "Extra..", "value": parseFloat(ci_personality['Extraversion'][0])},
            {"type": "personality", "name": "CI(-95%)", "dimension": "Agree..", "value": parseFloat(ci_personality['Agreeableness'][0])},
            {"type": "personality", "name": "CI(-95%)", "dimension": "Neg-Emo..", "value": parseFloat(ci_personality['Negative Emotionality'][0])},
            {"type": "personality", "name": "CI(-95%)", "dimension": "Open-Mind", "value": parseFloat(ci_personality['Open-Mindedness'][0])},
            {"type": "personality", "name": "CI(-95%)", "dimension": "Conscie..", "value": parseFloat(ci_personality['Conscientiousness'][0])},
            {"type": "personality", "name": (demo == 1? demo_people_names_match[usersinfo[t].name]:usersinfo[t].name), "dimension": "Extra..", "value": 0},
            {"type": "personality", "name": (demo == 1? demo_people_names_match[usersinfo[t].name]:usersinfo[t].name), "dimension": "Agree..", "value": 0},
            {"type": "personality", "name": (demo == 1? demo_people_names_match[usersinfo[t].name]:usersinfo[t].name), "dimension": "Neg-Emo..", "value": 0},
            {"type": "personality", "name": (demo == 1? demo_people_names_match[usersinfo[t].name]:usersinfo[t].name), "dimension": "Open-Mind", "value": 0},
            {"type": "personality", "name": (demo == 1? demo_people_names_match[usersinfo[t].name]:usersinfo[t].name), "dimension": "Conscie..", "value": 0}
          ];
    }
    if('Harm' in moralities[t]){
        var sample_data2 = [
            {"type": "morality", "name": "CI(95%)", "dimension": "Fairness", "value": parseFloat(ci_morality['Fairness'][1])},
            {"type": "morality", "name": "CI(95%)", "dimension": "Harm", "value": parseFloat(ci_morality['Harm'][1])},
            {"type": "morality", "name": "CI(95%)", "dimension": "Loyalty", "value": parseFloat(ci_morality['Loyalty'][1])},
            {"type": "morality", "name": "CI(95%)", "dimension": "Authority", "value": parseFloat(ci_morality['Authority'][1])},
            {"type": "morality", "name": "CI(95%)", "dimension": "Purity", "value": parseFloat(ci_morality['Purity'][1])},
            {"type": "morality", "name": "Average", "dimension": "Fairness", "value": parseFloat(average_morality['Fairness'])},
            {"type": "morality", "name": "Average", "dimension": "Harm", "value": parseFloat(average_morality['Harm'])},
            {"type": "morality", "name": "Average", "dimension": "Loyalty", "value": parseFloat(average_morality['Loyalty'])},
            {"type": "morality", "name": "Average", "dimension": "Authority", "value": parseFloat(average_morality['Authority'])},
            {"type": "morality", "name": "Average", "dimension": "Purity", "value": parseFloat(average_morality['Purity'])},
            {"type": "morality", "name": "CI(-95%)", "dimension": "Fairness", "value": parseFloat(ci_morality['Fairness'][0])},
            {"type": "morality", "name": "CI(-95%)", "dimension": "Harm", "value": parseFloat(ci_morality['Harm'][0])},
            {"type": "morality", "name": "CI(-95%)", "dimension": "Loyalty", "value": parseFloat(ci_morality['Loyalty'][0])},
            {"type": "morality", "name": "CI(-95%)", "dimension": "Authority", "value": parseFloat(ci_morality['Authority'][0])},
            {"type": "morality", "name": "CI(-95%)", "dimension": "Purity", "value": parseFloat(ci_morality['Purity'][0])},
            {"type": "morality", "name": (demo == 1? demo_people_names_match[usersinfo[t].name]:usersinfo[t].name), "dimension": "Fairness", "value": moralities[t]['Fairness']}, //personalities[p]['morality']['Fairness']
            {"type": "morality", "name": (demo == 1? demo_people_names_match[usersinfo[t].name]:usersinfo[t].name), "dimension": "Harm", "value": moralities[t]['Harm']}, //personalities[p]['morality']['Harm']
            {"type": "morality", "name": (demo == 1? demo_people_names_match[usersinfo[t].name]:usersinfo[t].name), "dimension": "Loyalty", "value": moralities[t]['Loyalty']}, //personalities[p]['morality']['Loyalty']
            {"type": "morality", "name": (demo == 1? demo_people_names_match[usersinfo[t].name]:usersinfo[t].name), "dimension": "Authority", "value": moralities[t]['Authority']}, //personalities[p]['morality']['Authority']
            {"type": "morality", "name": (demo == 1? demo_people_names_match[usersinfo[t].name]:usersinfo[t].name), "dimension": "Purity", "value": moralities[t]['Purity']} //personalities[p]['morality']['Purity']
          ];
    }
    else{
        var sample_data2 = [
            {"type": "morality", "name": "CI(95%)", "dimension": "Fairness", "value": parseFloat(ci_morality['Fairness'][1])},
            {"type": "morality", "name": "CI(95%)", "dimension": "Harm", "value": parseFloat(ci_morality['Harm'][1])},
            {"type": "morality", "name": "CI(95%)", "dimension": "Loyalty", "value": parseFloat(ci_morality['Loyalty'][1])},
            {"type": "morality", "name": "CI(95%)", "dimension": "Authority", "value": parseFloat(ci_morality['Authority'][1])},
            {"type": "morality", "name": "CI(95%)", "dimension": "Purity", "value": parseFloat(ci_morality['Purity'][1])},
            {"type": "morality", "name": "Average", "dimension": "Fairness", "value": parseFloat(average_morality['Fairness'])},
            {"type": "morality", "name": "Average", "dimension": "Harm", "value": parseFloat(average_morality['Harm'])},
            {"type": "morality", "name": "Average", "dimension": "Loyalty", "value": parseFloat(average_morality['Loyalty'])},
            {"type": "morality", "name": "Average", "dimension": "Authority", "value": parseFloat(average_morality['Authority'])},
            {"type": "morality", "name": "Average", "dimension": "Purity", "value": parseFloat(average_morality['Purity'])},
            {"type": "morality", "name": "CI(-95%)", "dimension": "Fairness", "value": parseFloat(ci_morality['Fairness'][0])},
            {"type": "morality", "name": "CI(-95%)", "dimension": "Harm", "value": parseFloat(ci_morality['Harm'][0])},
            {"type": "morality", "name": "CI(-95%)", "dimension": "Loyalty", "value": parseFloat(ci_morality['Loyalty'][0])},
            {"type": "morality", "name": "CI(-95%)", "dimension": "Authority", "value": parseFloat(ci_morality['Authority'][0])},
            {"type": "morality", "name": "CI(-95%)", "dimension": "Purity", "value": parseFloat(ci_morality['Purity'][0])},
            {"type": "morality", "name": (demo == 1? demo_people_names_match[usersinfo[t].name]:usersinfo[t].name), "dimension": "Fairness", "value": 0}, //personalities[p]['morality']['Fairness']
            {"type": "morality", "name": (demo == 1? demo_people_names_match[usersinfo[t].name]:usersinfo[t].name), "dimension": "Harm", "value": 0}, //personalities[p]['morality']['Harm']
            {"type": "morality", "name": (demo == 1? demo_people_names_match[usersinfo[t].name]:usersinfo[t].name), "dimension": "Loyalty", "value": 0}, //personalities[p]['morality']['Loyalty']
            {"type": "morality", "name": (demo == 1? demo_people_names_match[usersinfo[t].name]:usersinfo[t].name), "dimension": "Authority", "value": 0}, //personalities[p]['morality']['Authority']
            {"type": "morality", "name": (demo == 1? demo_people_names_match[usersinfo[t].name]:usersinfo[t].name), "dimension": "Purity", "value": 0} //personalities[p]['morality']['Purity']
          ];
    }
    var visualization1 = d3plus.viz()
        .container("#radar1")
        .data({
            "value": sample_data1, 
            "opacity": 0.5,
            "stroke": {"width": 1}
        })
        .id(["name", "dimension"])
        .size("value")
        .type("radar")
        .background("rgba(0,0,0,0)")
        .axes({"background": {"color": "rgba(0,0,0,0)"}, "mirror": true})
        .tooltip({"children":5, "size":false})
        .draw();
    var visualization2 = d3plus.viz()
        .container("#radar2")
        .data({
            "value": sample_data2, 
            "opacity": 0.5,
            "stroke": {"width": 1}
        })
        .id(["name", "dimension"])
        .size("value")
        .type("radar")
        .background("rgba(0,0,0,0)")
        .axes({"background": {"color": "rgba(0,0,0,0)"}, "mirror": true})
        .tooltip({"children":5, "size":false})
        .draw();

    top_layer = one_member.append("div").attr("class", "top_layer").append("div").attr("class", "leftstack_img_survey");
    top_layer.append("img").attr("id", "userpic").attr("class", "userpic_circle_survey")
            .attr("src", photo(usersinfo[t].name));
    top_layer.append("div").attr("class", "person_name_survey")
            .html(function(){
                if(demo == 0 || demo == null)
                    return (demo == 1? demo_people_names_match[usersinfo[t].name]:usersinfo[t].name);
                else{
                    return demo_people_names_match[usersinfo[t].name];
                }
            });
    var demographic_div = one_member.append("div").attr("class", "member_demographic");
    demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_gender").html('<div class="the_header">Gender: </div><div class="the_content">' 
        + ('demographics' in personalities[t] ? (personalities[t]['demographics']['gender'] == 'f'? 'Female' : (personalities[t]['demographics']['gender'] == 'm'? 'Male' : 'N/A')) : 'N/A') + '</div>');
    demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_age").html('<div class="the_header">Age: </div><div class="the_content">' + ('demographics' in personalities[t] ? personalities[t]['demographics']['age'] : 'N/A') + '</div>');
    demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_nationality").html('<div class="the_header">Nationality: </div><div class="the_content">' + ('nationality' in demographics[t] ? (demo == 1 ? "XXX": demographics[t]['nationality']) : 'NA') + '</div>');
    demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_ethnicity").html('<div class="the_header">Ethnicity: </div><div class="the_content">' + ('ethnicity' in demographics[t] ? (demo == 1 ? "XXX": demographics[t]['ethnicity']) : 'NA') + '</div>');
    demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_languages").html('<div class="the_header">Languages: </div><div class="the_content">' + ('languages' in demographics[t] ? (demo == 1 ? "XXX": demographics[t]['languages'].join(', ')) : 'NA') + '</div>');
    demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_position").html('<div class="the_header">Position: </div><div class="the_content">' + ('position' in demographics[t] ? demographics[t]['position'] : 'NA') + '</div>');
    demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_academic_degree").html('<div class="the_header">Academic degree: </div><div class="the_content">' + ('degree' in demographics[t] ? demographics[t]['degree'] : 'NA') + '</div>');
    demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_college_major").html('<div class="the_header">Major (college): </div><div class="the_content">' + ('major_college' in demographics[t] ? demographics[t]['major_college'] : 'NA') + '</div>');
    demographic_div.append("div").attr("class", "demographic_line").attr("id", "demographic_graduate_major").html('<div class="the_header">Major (graduate): </div><div class="the_content">' + ('major_graduate' in demographics[t] ? demographics[t]['major_graduate'] : 'NA') + '</div>');

    setTimeout(function(){ 
        var the_members = document.getElementById('items').getElementsByTagName("input");
        var the_labels = document.getElementById('items').getElementsByTagName("label");
        for(var kk = 0; kk < the_labels.length; kk++){
            the_labels[kk].style.backgroundColor = "#fff";
        }
        var nn = 3;
        the_labels[t].style.backgroundColor = d3.select("#radar1").selectAll("path")[0][nn].getAttribute("fill");
    }, 1000);
    setTimeout(function(){ 
        d3.select("#radar1").select("#d3plus_group_Average_radial").style("opacity", 0.4).select("path").style("fill", "rgb(230,230,230)");
        d3.select("#radar1").select("#d3plus_group_CI95_radial").style("opacity", 0.4).select("path").style("fill", "rgb(230,230,230)");
        d3.select("#radar1").select("#d3plus_group_CI-95_radial").style("opacity", 0.4).select("path").style("fill", "rgb(230,230,230)");
        d3.select("#radar2").select("#d3plus_group_Average_radial").style("opacity", 0.4).select("path").attr("fill", "rgb(230,230,230)");
        d3.select("#radar2").select("#d3plus_group_CI95_radial").style("opacity", 0.4).select("path").attr("fill", "rgb(230,230,230)");
        d3.select("#radar2").select("#d3plus_group_CI-95_radial").style("opacity", 0.4).select("path").attr("fill", "rgb(230,230,230)");
    }, 1000);

    one_member.select(".member_similarity").style("opacity", 1);
    var similarity = one_member.append("div").attr("class", "member_similarity");
    similarity.append("div").attr("id", "similarity_title").text("Normalized distance with other members");
    var sim_personality = similarity.append("div").attr("id", "similarity_personality");
    sim_personality.append("div").attr("id", "similarity_personality_title").text("Personality");
    sim_personality.append("div").attr("id", "similarity_personality_list");
    var sim_morality = similarity.append("div").attr("id", "similarity_morality");
    sim_morality.append("div").attr("id", "similarity_morality_title").text("Morality");
    sim_morality.append("div").attr("id", "similarity_morality_list");

    var personality_similarity = [], morality_similarity = [];
    for(var kk = 0; kk < usersinfo.length; kk++){
        if(t != kk){
            var similarity_score = 0, similarity_score2 = 0;
            var dd1 = [], dd2 = [], dd3 = [], dd4 = [];
            if('personality' in personalities[t]){
                for(var key in personalities[kk]['personality']){
                    dd1.push(personalities[t]['personality'][key] / 100.0);
                    dd2.push(personalities[kk]['personality'][key] / 100.0);
                }
            }
            if('personality' in personalities[t] && 'Open-Mindedness' in personalities[t]['personality'] && 'personality' in personalities[kk] && 'Open-Mindedness' in personalities[kk]['personality']){ 
                var this_data = new Array(
                    dd1, dd2
                );
                // similarity_score = pearsonCorrelation(this_data,0,1);
                similarity_score = EuclideanDistance(this_data);
                personality_similarity.push([usersinfo[kk].name, similarity_score]);
            }
            // // similarity_score /= 5.0; similarity_score = Math.sqrt(similarity_score); //euclidean distance
            // if('personality' in personalities[checked_index[0]] && 'Open-Mindedness' in personalities[checked_index[0]]['personality'] && 'personality' in personalities[kk] && 'Open-Mindedness' in personalities[kk]['personality']){ 
            //     similarity_score = similarity_score / (Math.sqrt(mag1) * Math.sqrt(mag2));
            //     personality_similarity.push([usersinfo[kk].name, similarity_score]);
            // }

            for(var key in moralities[kk]){
                // similarity_score2 += Math.pow((moralities[kk][key] - moralities[t][key]) / 5.0, 2);
                similarity_score2 += (moralities[kk][key] * moralities[t][key]);
                dd3.push(moralities[t][key] / 5.0);
                dd4.push(moralities[kk][key] / 5.0);
            }
            if('Harm' in moralities[t] && 'Harm' in moralities[kk]){
                var this_data2 = new Array(
                    dd3, dd4
                );
                // similarity_score2 = pearsonCorrelation(this_data2,0,1);
                similarity_score2 = EuclideanDistance(this_data2);
                morality_similarity.push([usersinfo[kk].name, similarity_score2]);
            }
            // var mag1 = 0; mag2 = 0, mag3 = 0, mag4 = 0;
            // if('personality' in personalities[t]){
            //     for(var key in personalities[kk]['personality']){
            //         // similarity_score += Math.pow((personalities[kk]['personality'][key] - personalities[t]['personality'][key]) / 100.0, 2); //euclidean distance
            //         similarity_score += (personalities[kk]['personality'][key] * personalities[t]['personality'][key]);
            //         mag1 += Math.pow(personalities[t]['personality'][key], 2);
            //         mag2 += Math.pow(personalities[kk]['personality'][key], 2);
            //     }
            // }
            // // similarity_score /= 5.0; similarity_score = Math.sqrt(similarity_score); //euclidean distance
            // if('personality' in personalities[t] && 'Open-Mindedness' in personalities[t]['personality'] && 'personality' in personalities[kk] && 'Open-Mindedness' in personalities[kk]['personality']){ 
            //     similarity_score = similarity_score / (Math.sqrt(mag1) * Math.sqrt(mag2));
            //     personality_similarity.push([usersinfo[kk].name, similarity_score]);
            // }

            // for(var key in moralities[kk]){
            //     // similarity_score2 += Math.pow((moralities[kk][key] - moralities[t][key]) / 5.0, 2);
            //     similarity_score2 += (moralities[kk][key] * moralities[t][key]);
            //     mag3 += Math.pow(moralities[t][key], 2);
            //     mag4 += Math.pow(moralities[kk][key], 2);
            // }
            // // similarity_score2 /= 5.0; similarity_score2 = Math.sqrt(similarity_score2);
            // if('Harm' in moralities[t] && 'Harm' in moralities[kk]){
            //     similarity_score2 = similarity_score2 / (Math.sqrt(mag3) * Math.sqrt(mag4));
            //     morality_similarity.push([usersinfo[kk].name, similarity_score2]);
            // }
        }
    }
    personality_similarity.sort(function (a, b) {
        return a[1] - b[1];
    });
    morality_similarity.sort(function (a, b) {
        return a[1] - b[1];
    });
    d3.range(personality_similarity.length).forEach(function(l){
        sim_personality.select("#similarity_personality_list").append("div").attr("class", "one_similarity").html(((l + 1) < 10? "&nbsp;":"") + (l + 1) + "&nbsp;" + (demo == 1? demo_people_names_match[personality_similarity[l][0]]:personality_similarity[l][0]) + " (" + personality_similarity[l][1].toFixed(3) + ")");
    });
    d3.range(morality_similarity.length).forEach(function(l){
        sim_morality.select("#similarity_morality_list").append("div").attr("class", "one_similarity").html(((l + 1) < 10? "&nbsp;":"") + (l + 1) + "&nbsp;" + (demo == 1? demo_people_names_match[morality_similarity[l][0]]:morality_similarity[l][0]) + " (" + morality_similarity[l][1].toFixed(3) + ")");
    });
};

var show_response_time = function(){
    var current_time_scale = "log";
    var colors = ['rgb(171, 43, 43)', 'rgb(27, 70, 108)'];
    var color = d3.scale.category10().range(colors);

    d3.select("#analysis_response_time_cover").select("svg").selectAll("*").remove();
    
    var p_margin = {top: 40, right: 70, bottom: 30, left: 170};
    var svg_width = $(window).width() * 0.8, svg_height = $(window).height() * 0.75;
    var p_width = svg_width - p_margin.left - p_margin.right, p_height = svg_height - p_margin.top - p_margin.bottom;
    var p_svg = d3.select("#analysis_response_time_svg")
        .attr("width", p_width + p_margin.left + p_margin.right).attr("height", p_height + p_margin.top + p_margin.bottom)
        .style("padding-bottom", "20px")
        .append("g").attr("transform", "translate(" + p_margin.left + "," + p_margin.top + ")");
    
    var new_data = [], aves = {}, ave_data = [];
    var all_data = [];

    var member_names = [];
    for(var kkk = 0; kkk < usersinfo.length; kkk++){
        member_names.push(usersinfo[kkk]['name']);
        member_names.push(usersinfo[kkk]['given_name'] + ' ' + usersinfo[kkk]['family_name']);
    }

    d3.range(responseTime.length).forEach(function (t) {
        if(member_names.indexOf(responseTime[t].name) != -1){
            var time_data = responseTime[t]['times'];
            var empty = 1;
            for(var member in time_data){
                if(member_names.indexOf(member) != -1)
                    if(time_data[member].length != 0){
                        empty = 0; break;
                    }
            }
            if(empty == 0){
                ave_data.push({'name': responseTime[t].name, 'ave': null, 'median': null});
            }
            aves[responseTime[t].name] = [];
        }
    });
    d3.range(responseTime.length).forEach(function (t) {
        if(member_names.indexOf(responseTime[t].name) != -1){
            var time_data = responseTime[t]['times'];
            
            var reducer = function(a, b) { return a + b; };
            for(var member in time_data){
                if(member_names.indexOf(member) != -1){
                    if(time_data[member].length != 0){
                        aves[member] = aves[member].concat(time_data[member]);
                        all_data = all_data.concat(time_data[member]);
                        var ave = time_data[member].reduce(reducer) / time_data[member].length,
                            square = time_data[member].map(function(d) { return Math.pow(d - ave, 2); }).reduce(reducer) / time_data[member].length,
                            ci0 = ave - 1.96 * Math.sqrt(square) / Math.sqrt(time_data[member].length),
                            ci1 = ave + 1.96 * Math.sqrt(square) / Math.sqrt(time_data[member].length);
                        if(demo == 1){
                            new_data.push({"to": demo_people_names_match[responseTime[t].name], "from": demo_people_names_match[member], "times": time_data[member], "mean": parseFloat(ave.toFixed(2)), "max": d3.max(time_data[member]), "min": d3.min(time_data[member]), "ci0": parseFloat(ci0.toFixed(2)), "ci1": parseFloat(ci1.toFixed(2)), "median": d3.quantile(time_data[member].sort(d3.ascending), 0.5), "quartile1": d3.quantile(time_data[member].sort(d3.ascending), 0.25), "quartile3": d3.quantile(time_data[member].sort(d3.ascending), 0.75)});
                        }
                        else
                           new_data.push({"to": responseTime[t].name, "from": member, "times": time_data[member], "mean": parseFloat(ave.toFixed(2)), "max": d3.max(time_data[member]), "min": d3.min(time_data[member]), "ci0": parseFloat(ci0.toFixed(2)), "ci1": parseFloat(ci1.toFixed(2)), "median": d3.quantile(time_data[member].sort(d3.ascending), 0.5), "quartile1": d3.quantile(time_data[member].sort(d3.ascending), 0.25), "quartile3": d3.quantile(time_data[member].sort(d3.ascending), 0.75)});
                    }
                }
            }
        }
    });
    var reducer = function(a, b) { return a + b; };
    for(var k = 0; k < ave_data.length; k++){
        if(aves[ave_data[k].name].length != 0){
            var the_ave = aves[ave_data[k].name].reduce(reducer) / aves[ave_data[k].name].length;
            ave_data[k].ave = the_ave;
            ave_data[k].median = d3.quantile(aves[ave_data[k].name].sort(d3.ascending), 0.5);
        }
    }//console.log(ave_data);

    var name_domains = [];
    for(var kk = 0; kk < responseTime.length; kk++){
        if(member_names.indexOf(responseTime[kk]['name']) != -1)
            name_domains.push(demo == 1? demo_people_names_match[responseTime[kk]['name']]:responseTime[kk]['name']);
    }
    var x = d3.scale.ordinal()     
        .domain(name_domains)  
        .rangeRoundBands([0 , p_height * 0.78], 0.7, 0.3);        

    var time_max = Math.pow(2, Math.ceil(Math.log(d3.max(new_data, function(d){ return d.quartile3;}) + 60) / Math.log(2)));
    //var time_max = d3.max(new_data, function(d){ return d.quartile3;}) + 60;
    var formatNumber = d3.format(",.0f");
    var min_for_x = 1;
    var y = d3.scale.linear()
        .domain([0, time_max]) 
        .range([0, p_width]),
        y_log = d3.scale.log().base(2)
        .domain([min_for_x, time_max])
        .range([0, p_width]);
    
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("left");
    var yAxis = d3.svg.axis()
        .scale(y_log).ticks(6, function(d) { return formatNumber(d) })
        .orient("bottom");

    //draw y axis
    p_svg.append("g")
        .attr("class", "x axis")
        .call(xAxis);
        // .append("text") // and text1
          // .attr("transform", "rotate(-90)")
          // .attr("y", 6)
          // .attr("dy", ".71em")
          // .style("text-anchor", "end")
          // .style("font-size", "16px")
          // .text("Members");        
    // draw x axis  
    p_svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(0," + (p_height * 0.78) + ")")
      .call(yAxis)
      .append("text")             // text label for the x axis
        .attr("x", (p_width - 34))
        .attr("y",  26 )
        .attr("dy", ".71em")
        // .style("text-anchor", "start")
        .style("font-size", "16px") 
        .text("Minutes"); 

    function make_y_axis2() {        
        return d3.svg.axis()
            .scale(x)
             .orient("left")
             .ticks(responseTime.length);
    }
    p_svg.append("g")         
        .attr("class", "grid")
        .call(make_y_axis2()
            .tickSize(-p_width, 0, 0)
            .tickFormat("")
        );
    p_svg.select(".grid").selectAll("path").style("opacity", 0);
    p_svg.select(".x.axis").selectAll("line").style("stroke", "rgba(255,255,255,0.4)");
    p_svg.select(".x.axis").selectAll("path").style("opacity", 0);
    p_svg.select(".x.axis").selectAll("text").attr("x", -19);

    function addWhite(color){
        var r = 0, g = 0, b = 0;
        var color2 = "#ffffff";
        var ratio1 = 5, ratio2 = 1;
        r = (parseInt(color.substring(1, 3), 16) * ratio1 + parseInt(color2.substring(1, 3), 16) * ratio2) / (ratio1 + ratio2);
        g = (parseInt(color.substring(3, 5), 16) * ratio1 + parseInt(color2.substring(3, 5), 16) * ratio2) / (ratio1 + ratio2);
        b = (parseInt(color.substring(5, 7), 16) * ratio1 + parseInt(color2.substring(5, 7), 16) * ratio2) / (ratio1 + ratio2);        
        // r /= 2; g /= 2; b /= 2; 
        r = Math.round(r); g = Math.round(g); b = Math.round(b);
        r = r.toString(16); g = g.toString(16); b = b.toString(16); 
        return "#" + (r.length == 1 ? "0" + r : r) + (g.length == 1 ? "0" + g : g) + (b.length == 1 ? "0" + b : b);
    }

    var color = function(name){
        var i;
        if(demo == 1)
            i = usersinfo.findIndex(x =>(demo_people_names_match[x.given_name+' '+x.family_name])==name || demo_people_names_match[x.name]==name);
        else
            i = usersinfo.findIndex(x => (x.given_name+' '+x.family_name)==name || x.name==name);
        var colors = ["#D82020", "#D83A20", "#D85B20", "#D88520", "#D8AD20", "#E1C320", "#D4D820", "#C2D820", "#90D820", "#5ED820", "#2CD820", "#26CB79", "#20CFD8", "#208ED8", "#2029D8", "#6820D8"];
        // return colors[Math.round(i * (colors.length - 1) / (usersinfo.length - 1))];
        return addWhite(colors[Math.round(i * (colors.length - 1) / (usersinfo.length - 1))]);
    };
    var size_scale =d3.scale.linear().domain([d3.min(new_data, function(d){ return d.times.length;}), d3.max(new_data, function(d){ return d.times.length;})]).range([5, 15]);
    var baseY = p_height * 0.78 / responseTime.map(function(d) { return (demo == 1? demo_people_names_match[d['name']]:d['name']);}).length * 0.157;
    var box = p_svg.selectAll(".box")      
      .data(new_data)
      .enter().append("g")
      .attr("class", "box")
      // .attr("transform", function(d) { return "translate(" +  y(d["mean"])  + "," + x(d["from"]) + ")"; })
      .attr("transform", function(d) { return "translate(" +  y_log(d["median"])  + "," + x(d["from"]) + ")"; })
      .style("opacity", 0.85);
    box.append("line").attr("class", "box_line")
       // .attr("x1", function(d){ return (y(d["ci0"]<0? 0:(d["ci0"]>time_max? time_max:d["ci0"])) - y(d["mean"]));}).attr("y1", baseY)
       // .attr("x2", function(d){ return (y(d["ci1"]>time_max? time_max:(d["ci1"]<0? 0:d["ci1"])) - y(d["mean"]));}).attr("y2", baseY)
       .attr("x1", function(d){ return (y_log(d["quartile1"]<min_for_x? min_for_x:(d["quartile1"]>time_max? time_max:d["quartile1"])) - y_log(d["median"]));}).attr("y1", baseY)
       .attr("x2", function(d){ return (y_log(d["quartile3"]>time_max? time_max:(d["quartile3"]<min_for_x? min_for_x:d["quartile3"])) - y_log(d["median"]));}).attr("y2", baseY)
       .attr("stroke", function(d){ return color(d["to"]); })
       .attr("stroke-width", "2").attr("opacity", 0.4);
    box.append("circle").attr("class", "box_circle")
       .attr("cx", 0).attr("cy", baseY)
       .attr("stroke", null)
       .attr("fill", function(d){ return color(d["to"]); })
       .attr("r", function(d){
            return size_scale(d.times.length);
       })
       // .attr("opacity", function(d){ return (d['mean']<0? 0:(d['mean']>time_max? 0:1));})
       .attr("opacity", function(d){ return (d['median']<min_for_x? 0:(d['median']>time_max? 0:1));})
       .on("mouseover", function(d){
            p_svg.selectAll(".box").style("opacity", function(dd){
                if(dd['to'] == d['to']) return 0.85;
                else return 0.1;
            });
            p_svg.selectAll(".box").selectAll("line").attr("opacity", function(dd){
                if(dd['to'] == d['to']) return 1;
                else return 0.4;
            });
            p_svg.selectAll(".box").selectAll("rect").attr("opacity", function(dd){
                if(dd['to'] == d['to']) return 1;
                else return 0.4;
            });
            p_svg.selectAll(".ave_polygon").style("opacity", 0.1);

            var t = d3.transform(d3.select(this.parentNode).attr("transform")),
                tx = t.translate[0],
                ty = t.translate[1];
            p_svg.select("#cursor_line").attr("opacity", 1)
                .attr("x1", parseFloat(d3.select(this).attr("cx")) + tx)
                .attr("y1", parseFloat(d3.select(this).attr("cy")) + ty + size_scale(d.times.length))
                .attr("x2", parseFloat(d3.select(this).attr("cx")) + tx)
                .attr("y2", p_height);

            var texts = p_svg.select(".x.axis").selectAll("text")[0];
            for(var kk = 0; kk < texts.length; kk++){
                if(d3.select(texts[kk]).text() == d['to']){
                    d3.select(texts[kk]).style("fill", color(d['to']));
                }
            }
            var the_left = this.getBoundingClientRect().left, 
                the_top = this.getBoundingClientRect().top;
            tooltip.style("display", "block").style("left", (the_left - 100) + "px").style("top", (the_top - 71) + "px");
            tooltip.select("#to_name").text(d['to']);
            tooltip.select("#to_count").text(d['times'].length);
            // tooltip.select("#ave").text(d['mean']);
            tooltip.select("#ave").text(d['median']);
       })
       .on("mouseout", function(d){
            p_svg.selectAll(".box").style("opacity", 0.85);
            p_svg.selectAll(".box").selectAll("line").attr("opacity", 0.4);
            p_svg.selectAll(".box").selectAll(".box_rect1")
                // .attr("opacity", function(d){ return (d['ci1']>time_max? 0:(d['ci1']<0? 0:0.4));})
                .attr("opacity", function(d){ return (d['quartile1']>time_max? 0:(d['quartile1']<min_for_x? 0:0.4));});
            p_svg.selectAll(".box").selectAll(".box_rect2")
                // .attr("opacity", function(d){ return (d['ci1']>time_max? 0:(d['ci1']<0? 0:0.4));})
                .attr("opacity", function(d){ return (d['quartile3']>time_max? 0:(d['quartile3']<min_for_x? 0:0.4));});
            p_svg.selectAll(".ave_polygon")
                // .style("opacity", function(d){ return (d['ave']<0? 0:(d['ave']>time_max? 0:0.85));})
                .style("opacity", function(d){ return (d['median']<min_for_x? 0:(d['median']>time_max? 0:0.85));});
            p_svg.select(".x.axis").selectAll("text").style("fill", "white");
            p_svg.select("#cursor_line").attr("opacity", 0);

            tooltip.style("display", "none");
       });
    box.append("rect").attr("class", "box_rect1")
       // .attr("x", function(d){ return (y(d["ci0"]) - y(d["mean"])) - 1;})
       // .attr("width", function(d){ return (d["ci0"]<0? 0:2);})
       .attr("x", function(d){ return (y_log(d["quartile1"]) - y_log(d["median"])) - 1;})
       .attr("width", function(d){ return (d["quartile1"]<0? 0:2);})
       .attr("y", baseY - 10)
       // .attr("opacity", function(d){ return (d['ci0']<0? 0:(d['ci0']>time_max? 0:0.4));})
       .attr("opacity", function(d){ return (d['quartile1']<min_for_x? 0:(d['quartile1']>time_max? 0:0.4));})
       .attr("height", 20).attr("opacity", 0.4)
       .attr("fill", function(d){ return color(d["to"]); });
    box.append("rect").attr("class", "box_rect2")
       // .attr("x", function(d){ return (y(d["ci1"]) - y(d["mean"])) - 1;})
       // .attr("width", function(d){ return (d["ci1"]>time_max? 0:2);})
       .attr("x", function(d){ return (y_log(d["quartile3"]) - y_log(d["median"])) - 1;})
       .attr("width", function(d){ return (d["quartile3"]>time_max? 0:2);})
       .attr("y", baseY - 10)
       // .attr("opacity", function(d){ return (d['ci1']>time_max? 0:(d['ci1']<0? 0:0.4));})
       .attr("opacity", function(d){ return (d['quartile3']>time_max? 0:(d['quartile3']<min_for_x? 0:0.4));})
       .attr("height", 20).attr("opacity", 0.4)
       .attr("fill", function(d){ return color(d["to"]); });
    var polygon = p_svg.selectAll(".ave_polygon")      
      .data(ave_data)
      .enter().append("g")
      .attr("class", "ave_polygon")
      // .attr("transform", function(d) { return "translate(" +  y(d["ave"])  + "," + (x(d["name"])+baseY) + ")"; })
      .attr("transform", function(d) { return "translate(" +  y_log(d["median"])  + "," + (x((demo == 1? demo_people_names_match[d["name"]]: d["name"]))+baseY) + ")"; })
      // .style("opacity", function(d){ return (d['ave']<0? 0:(d['ave']>time_max? 0:0.85));})
      .style("opacity", function(d){ return (d['median']<min_for_x? 0:(d['median']>time_max? 0:0.85));})
      .on("mouseover", function(d){
            p_svg.selectAll(".ave_polygon")//.select(".box_polygon")
                // .style("opacity", function(d){ return (d['ave']<0? 0:(d['ave']>time_max? 0:0.85));})
                .style("opacity", function(d){ return (d['median']<min_for_x? 0:(d['median']>time_max? 0:0.85));});
            p_svg.selectAll(".box").style("opacity", 0.1);

            var the_left = this.getBoundingClientRect().left, 
                the_top = this.getBoundingClientRect().top;
            tooltip2.style("display", "block").style("left", (the_left - 150) + "px").style("top", (the_top - 32) + "px");
            tooltip2.select("#to_name").text((demo == 1? demo_people_names_match[d['name']] : d['name']));
            // tooltip2.select("#ave").text(parseFloat(d['ave'].toFixed(2)));
            tooltip2.select("#ave").text(parseFloat(d['median'].toFixed(2)));

            var t = d3.transform(d3.select(this).attr("transform")),
                tx = t.translate[0],
                ty = t.translate[1];
            p_svg.select("#cursor_line").attr("opacity", 1)
                .attr("x1", tx)
                .attr("y1", ty + 15)
                .attr("x2", tx)
                .attr("y2", p_height);
       })
       .on("mouseout", function(d){
            p_svg.selectAll(".ave_polygon")//.select(".box_polygon")
                // .style("opacity", function(d){ return (d['ave']<0? 0:(d['ave']>time_max? 0:0.85));})
                .style("opacity", function(d){ return (d['median']<min_for_x? 0:(d['median']>time_max? 0:0.85));});
            p_svg.selectAll(".box").style("opacity", 0.85);
            p_svg.select("#cursor_line").attr("opacity", 0);

            tooltip2.style("display", "none");
       });
    polygon.append("polygon").attr("class", "box_polygon")
       .attr("points", function(d){ return "0,-15 6.5,0 0,15 -6.5,0";})
       .attr("fill", function(d){ return "rgba(220,220,220,0.95)"; });
    p_svg.append("line").attr("id", "cursor_line")
        .style("stroke-dasharray", ("4, 4"))
        .attr("stroke", "rgba(230,230,230,0.9)")
        .attr("opacity", 0);

    p_svg.select(".x.axis").selectAll("text")
        .style("cursor", "default")
        .on("mouseover", function(d){
            d3.select(this).style("fill", color(d));

            p_svg.selectAll(".box").style("opacity", function(dd){
                if(dd['to'] == d) return 0.85;
                else return 0.1;
            });
            p_svg.selectAll(".box").selectAll("line").attr("opacity", function(dd){
                if(dd['to'] == d) return 1;
                else return 0.4;
            });
            p_svg.selectAll(".box").selectAll("rect").attr("opacity", function(dd){
                if(dd['to'] == d) return 1;
                else return 0.4;
            });
            p_svg.selectAll(".ave_polygon").style("opacity", 0.1);
        })
        .on("mouseout", function(d){
            d3.select(this).style("fill", "white");

            p_svg.selectAll(".box").style("opacity", 0.85);
            p_svg.selectAll(".box").selectAll("line").attr("opacity", 0.4);
            p_svg.selectAll(".box").selectAll(".box_rect1")
                .attr("opacity", function(dd){ return (dd['quartile1']>time_max? 0:(dd['quartile1']<min_for_x? 0:0.4));});
            p_svg.selectAll(".box").selectAll(".box_rect2")
                .attr("opacity", function(dd){ return (dd['quartile3']>time_max? 0:(dd['quartile3']<min_for_x? 0:0.4));});
            p_svg.selectAll(".ave_polygon")
                .style("opacity", function(dd){ return (dd['median']<min_for_x? 0:(dd['median']>time_max? 0:0.85));});
        });
    // var texts = p_svg.select(".x.axis").selectAll("text")[0];
    // for(var kk = 0; kk < texts.length; kk++){
    //     if(d3.select(texts[kk]).text() == d['to']){
    //         d3.select(texts[kk]).style("fill", color(d['to']));
    //     }
    // }

    var tooltip = d3.select("#time_tooltip");
    var tooltip2 = d3.select("#timeave_tooltip");
    
    //lower svg
    var x_mini = d3.scale.linear()
        .domain([0, time_max])
        .range([0, p_width]),
        x_mini_log = d3.scale.log().base(2)
        .domain([min_for_x, time_max])
        .range([0, p_width]);
    var main_xZoom = d3.scale.linear()
        .range([0, p_width])
        .domain([min_for_x, time_max]);

    var bins = d3.layout.histogram()
        .bins(x_mini.ticks(80))
        (all_data),
        bins_log = d3.layout.histogram()
        .bins(x_mini_log.ticks(40))
        (all_data);

    var yMax = d3.max(bins, function(d){return d.length}),
        yMin = d3.min(bins, function(d){return d.length}),
        yMax_log = d3.max(bins_log, function(d){return Math.ceil(d.length / d.dx)}),
        yMin_log = d3.min(bins_log, function(d){return d.length});

    var y_mini = d3.scale.linear()
        .domain([0, yMax_log])
        .range([p_height * 0.15, 0]),
        y_mini_normalized = d3.scale.linear()
        .domain([0, yMax_log / all_data.length])
        .range([p_height * 0.15, 0]);
    var y_mini_log = d3.scale.log().base(2)
        .domain([0.001, yMax_log])
        .range([p_height * 0.15, 0]),
        y_mini_log_normalized = d3.scale.log().base(2)
        .domain([0.001, yMax_log / all_data.length])
        .range([p_height * 0.15, 0]);

    var brush = d3.svg.brush()
        .x(x_mini_log)
        .on("brush", brushed);

    var formatNumber2 = d3.format(",.3f");
    var xAxis_mini = d3.svg.axis()
        .scale(x_mini_log).ticks(6, function(d) { return formatNumber(d) })
        .orient("bottom");
    var yAxis_mini = d3.svg.axis()
        .scale(y_mini_log_normalized)
        .ticks(3, function(d) { return formatNumber2(d) })
        .orient("left");

    var mini_x = p_svg.append("g")
        .attr("class", "x axis2")
        .attr("transform", "translate(0," + p_height + ")")
        .call(xAxis_mini);
    mini_x.append("text")        
        .attr("x", (p_width - 34))
        .attr("y",  26 )
        .attr("dy", ".71em")
        .style("font-size", "16px") 
        .text("Minutes");

    var brush_x_grab = mini_x.append("g")
            .attr("class", "x brush")
            .attr("transform", "translate(0, -" + (p_height * 0.15) + ")")
            .call(brush);
    brush_x_grab.selectAll("rect").attr("height", (p_height * 0.15));
 
    p_svg.append("g")
      .attr("class", "y axis2")
      .attr("transform", "translate(0," + (p_height * 0.85) + ")")
      .call(yAxis_mini)
      .append("text")     
        .attr("transform", "rotate(-90)")        
        .attr("x", -(p_height * 0.15)/2)
        .attr("y",  -75)
        .attr("dy", ".71em")
        .style("text-anchor", "middle")
        .style("font-size", "14px") 
        .text("Probability"); 

    // var fill = d3.scale.linear()
    //     .domain([0.1, 0.85])
    //     .range([0, d3.max(bins_log, function(d){ return (x_mini_log(d.x + d.dx) - x_mini_log(d.x)) - 1; })]);
    var bar_width = x_mini(bins[0].dx) - x_mini(0);
    var bar = p_svg.selectAll(".bar")
        .data(bins_log)
      .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function(d) { return "translate(" + x_mini_log(d.x) + "," + (p_height - (p_height * 0.15 - y_mini_log(d.y / d.dx))) + ")"; });
    bar.append("rect")
        .attr("x", 1)
        // .attr("width", (bar_width) - 1)
        .attr("width", function(d,i){return (x_mini_log(d.x + d.dx) - x_mini_log(d.x)) - 1;})
        .attr("height", function(d) { return (p_height * 0.15 - y_mini_log(d.y / d.dx)) ; })
        .attr("fill", function(d) { return "rgba(200,200,200,0.85)" })
        .attr("display", "none");
    var valueline_log = d3.svg.line().interpolate("monotone")
        .x(function(d) { return x_mini_log(d.x + d.dx / 2); })
        .y(function(d) { return (p_height - (p_height * 0.15 - y_mini_log(d.y / d.dx))); }),
        valueline = d3.svg.line().interpolate("monotone")
        .x(function(d) { return x_mini(d.x); })
        .y(function(d) { return (p_height - (p_height * 0.15 - y_mini(d.y))); });
    p_svg.append("path")
        .attr("class", "time_pattern_line")
        .attr("d", valueline_log(bins_log));

    function brushed(){
        // var originalRange = main_xZoom.range();
        // main_xZoom.domain(brush.empty() ? [min_for_x, time_max] : brush.extent());
        if(current_time_scale == "linear") var the_y = y;
        else var the_y = y_log;
        the_y.domain(brush.empty() ? [min_for_x, time_max] : brush.extent());
        y.domain(brush.empty() ? [min_for_x, time_max] : brush.extent());
        yAxis.scale(the_y);
        p_svg.select(".y.axis").call(yAxis);

        if(!brush.empty()){
            // box.attr("transform", function(d) { return "translate(" +  the_y(d["mean"])  + "," + x(d["from"]) + ")"; });
            box.attr("transform", function(d) { return "translate(" +  the_y(d["median"])  + "," + x(d["from"]) + ")"; });
            box.select(".box_line")
               // .attr("x1", function(d){ return (the_y(d["ci0"]<brush.extent()[0]? brush.extent()[0]:(d["ci0"]>brush.extent()[1]? brush.extent()[1]:d["ci0"])) - the_y(d["mean"]));})
               // .attr("x2", function(d){ return (the_y(d["ci1"]>brush.extent()[1]? brush.extent()[1]:(d["ci1"]<brush.extent()[0]? brush.extent()[1]:d['ci1'])) - the_y(d["mean"]));})
               .attr("x1", function(d){ return (the_y(d["quartile1"]<brush.extent()[0]? brush.extent()[0]:(d["quartile1"]>brush.extent()[1]? brush.extent()[1]:d["quartile1"])) - the_y(d["median"]));})
               .attr("x2", function(d){ return (the_y(d["quartile3"]>brush.extent()[1]? brush.extent()[1]:(d["quartile3"]<brush.extent()[0]? brush.extent()[1]:d['quartile3'])) - the_y(d["median"]));});
            box.select(".box_rect1")
               // .attr("x", function(d){ return (the_y(d["ci0"]) - the_y(d["mean"])) - 1;})
               // .attr("width", function(d){ return (d["ci0"]<brush.extent()[0]? 0:2);})
               // .attr("opacity", function(d){ return (d['ci0']<brush.extent()[0]? 0:(d['ci0']>brush.extent()[1]? 0:0.4));})
               .attr("x", function(d){ return (the_y(d["quartile1"]) - the_y(d["median"])) - 1;})
               .attr("width", function(d){ return (d["quartile1"]<brush.extent()[0]? 0:2);})
               .attr("opacity", function(d){ return (d['quartile1']<brush.extent()[0]? 0:(d['quartile1']>brush.extent()[1]? 0:0.4));});
            box.select(".box_rect2")
               // .attr("x", function(d){ return (the_y(d["ci1"]) - the_y(d["mean"])) - 1;})
               // .attr("width", function(d){ return (d["ci1"]>brush.extent()[1]? 0:2);})
               // .attr("opacity", function(d){ return (d['ci1']>brush.extent()[1]? 0:(d['ci1']<brush.extent()[0]? 0:0.4));})
               .attr("x", function(d){ return (the_y(d["quartile3"]) - the_y(d["median"])) - 1;})
               .attr("width", function(d){ return (d["quartile3"]>brush.extent()[1]? 0:2);})
               .attr("opacity", function(d){ return (d['quartile3']>brush.extent()[1]? 0:(d['quartile3']<brush.extent()[0]? 0:0.4));});
            polygon
              // .attr("transform", function(d) { return "translate(" +  the_y(d["ave"])  + "," + (x(d["name"])+baseY) + ")"; })
              // .style("opacity", function(d){ return (d['ave']<brush.extent()[0]? 0:(d['ave']>brush.extent()[1]? 0:1));})
              .attr("transform", function(d) { return "translate(" +  the_y(d["median"])  + "," + (x(d["name"])+baseY) + ")"; })
              .style("opacity", function(d){ return (d['median']<brush.extent()[0]? 0:(d['median']>brush.extent()[1]? 0:1));});
            box.select(".box_circle")
               // .attr("opacity", function(d){ return (d['mean']<brush.extent()[0]? 0:(d['mean']>brush.extent()[1]? 0:1));})
               .attr("opacity", function(d){ return (d['median']<brush.extent()[0]? 0:(d['median']>brush.extent()[1]? 0:1));});
       }
       else{
            box.attr("transform", function(d) { return "translate(" +  the_y(d["median"])  + "," + x(d["from"]) + ")"; });
            box.select(".box_line")
               .attr("x1", function(d){ return (the_y(d["quartile1"]<min_for_x? min_for_x:(d["quartile1"]>time_max? time_max:d["quartile1"])) - the_y(d["median"]));})
               .attr("x2", function(d){ return (the_y(d["quartile3"]>time_max? time_max:(d["quartile3"]<min_for_x? time_max:d['quartile3'])) - the_y(d["median"]));});
            box.select(".box_rect1")
               .attr("x", function(d){ return (the_y(d["quartile1"]) - the_y(d["median"])) - 1;})
               .attr("width", function(d){ return (d["quartile1"]<min_for_x? 0:2);})
               .attr("opacity", function(d){ return (d['quartile1']<min_for_x? 0:(d['quartile1']>time_max? 0:0.4));});
            box.select(".box_rect2")
               .attr("x", function(d){ return (the_y(d["quartile3"]) - the_y(d["median"])) - 1;})
               .attr("width", function(d){ return (d["quartile3"]>time_max? 0:2);})
               .attr("opacity", function(d){ return (d['quartile3']>time_max? 0:(d['quartile3']<min_for_x? 0:0.4));});
            polygon
               .attr("transform", function(d) { return "translate(" +  the_y(d["median"])  + "," + (x(d["name"])+baseY) + ")"; })
               .style("opacity", function(d){ return (d['median']<min_for_x? 0:(d['median']>time_max? 0:1));});
            box.select(".box_circle")
               .attr("opacity", function(d){ return (d['median']<min_for_x? 0:(d['median']>time_max? 0:1));});
       }
    }

    d3.select("#time_scale").select("#time_linear").on("click", function(){
        current_time_scale = "linear";
        min_for_x = 0; main_xZoom.domain([min_for_x, time_max]);
        d3.select("#time_scale").select("#time_log").style("background-color", "rgba(184,184,184,0)");
        d3.select("#time_scale").select("#time_linear").style("background-color", "rgba(184,184,184,1)");

        yAxis.scale(y).ticks(6, function(d) { return formatNumber(d)});
        p_svg.select(".y.axis").transition().duration(500).call(yAxis);

        xAxis_mini.scale(x_mini).ticks(6, function(d) { return formatNumber(d)});
        mini_x.transition().duration(500).call(xAxis_mini);
        y_mini.domain([0, yMax]);
        y_mini_normalized.domain([0, yMax / all_data.length]);
        yAxis_mini.scale(y_mini_normalized);
        p_svg.select(".y.axis2").transition().duration(500).call(yAxis_mini);

        brush.x(x_mini);
        brush_x_grab.call(brush);

        box.transition().duration(500)
            // .attr("transform", function(d) { return "translate(" +  y(d["mean"])  + "," + x(d["from"]) + ")"; })
            .attr("transform", function(d) { return "translate(" +  y(d["median"])  + "," + x(d["from"]) + ")"; });
        box.select(".box_line")
           .attr("x1", function(d){ return (y(d["quartile1"]<0? 0:(d["quartile1"]>time_max? time_max:d["quartile1"])) - y(d["median"]));})
           .attr("x2", function(d){ return (y(d["quartile3"]>time_max? time_max:(d["quartile3"]<0? 0:d["quartile3"])) - y(d["median"]));});
           // .attr("x1", function(d){ return (y(d["ci0"]<0? 0:(d["ci0"]>time_max? time_max:d["ci0"])) - y(d["mean"]));})
           // .attr("x2", function(d){ return (y(d["ci1"]>time_max? time_max:(d["ci1"]<0? 0:d["ci1"])) - y(d["mean"]));});
        box.select(".box_rect1")
           // .attr("x", function(d){ return (y(d["ci0"]) - y(d["mean"])) - 1;})
           .attr("x", function(d){ return (y(d["quartile1"]) - y(d["median"])) - 1;});
        box.select(".box_rect2")
           // .attr("x", function(d){ return (y(d["ci1"]) - y(d["mean"])) - 1;})
           .attr("x", function(d){ return (y(d["quartile3"]) - y(d["median"])) - 1;});
        polygon.transition().duration(500)
            // .attr("transform", function(d) { return "translate(" +  y(d["ave"])  + "," + (x(d["name"])+baseY) + ")"; })
            .attr("transform", function(d) { return "translate(" +  y(d["median"])  + "," + (x(d["name"])+baseY) + ")"; });

        var new_bar = p_svg.selectAll(".bar")
            .data(bins);
        new_bar.transition().duration(500)
            .attr("transform", function(d) { return "translate(" + x_mini(d.x) + "," + (y_mini(d.y) + p_height * 0.85) + ")"; })
            .each(function(){
                d3.select(this).select("rect")
                    .transition().duration(500)
                    .attr("width", (bar_width) - 1)
                    .attr("height", function(d) { return p_height * 0.15 - y_mini(d.y); })
                    .attr("display", "block");
            });
        new_bar.enter().append("g")
            .attr("class", "bar")
            .attr("transform", function(d) { return "translate(" + x_mini(d.x) + "," + (y_mini(d.y) + p_height * 0.85) + ")"; })
            .each(function(){
                d3.select(this).select("rect")
                    .transition().duration(500)
                    .attr("x", 1)
                    .attr("fill", function(d) { return "rgba(200,200,200,0.85)" })
                    .attr("width", (bar_width) - 1)
                    .attr("height", function(d) { return p_height * 0.15 - y_mini(d.y); })
                    .attr("display", "block");
            });
        new_bar.exit().remove();

        p_svg.select(".time_pattern_line").transition().duration(500)
            .attr("d", valueline(bins))
            .attr("display", "none");
    });
    d3.select("#time_scale").select("#time_log").on("click", function(){
        current_time_scale = "log";
        min_for_x = 1; main_xZoom.domain([min_for_x, time_max]);
        d3.select("#time_scale").select("#time_log").style("background-color", "rgba(184,184,184,1)");
        d3.select("#time_scale").select("#time_linear").style("background-color", "rgba(184,184,184,0)");

        yAxis.scale(y_log).ticks(4, function(d) { return formatNumber(d)});
        p_svg.select(".y.axis").transition().duration(500).call(yAxis);

        xAxis_mini.scale(x_mini_log);//.ticks(4, function(d) { return formatNumber(d)});
        mini_x.transition().duration(500).call(xAxis_mini);
        y_mini_log.domain([0.001, yMax_log]);
        y_mini_log_normalized.domain([0.001, yMax_log / all_data.length]);
        yAxis_mini.scale(y_mini_log_normalized);
        p_svg.select(".y.axis2").transition().duration(500).call(yAxis_mini);

        brush.x(x_mini_log);
        brush_x_grab.call(brush);

        box.transition().duration(500)
            // .attr("transform", function(d) { return "translate(" +  y_log(d["mean"])  + "," + x(d["from"]) + ")"; })
            .attr("transform", function(d) { return "translate(" +  y_log(d["median"])  + "," + x(d["from"]) + ")"; });
        box.select(".box_line")
           // .attr("x1", function(d){ return (y_log(d["ci0"]<0.1? 0.1:(d["ci0"]>time_max? time_max:d["ci0"])) - y_log(d["mean"]));})
           // .attr("x2", function(d){ return (y_log(d["ci1"]>time_max? time_max:(d["ci1"]<0.1? 0.1:d["ci1"])) - y_log(d["mean"]));})
           .attr("x1", function(d){ return (y_log(d["quartile1"]<min_for_x? min_for_x:(d["quartile1"]>time_max? time_max:d["quartile1"])) - y_log(d["median"]));})
           .attr("x2", function(d){ return (y_log(d["quartile3"]>time_max? time_max:(d["quartile3"]<min_for_x? min_for_x:d["quartile3"])) - y_log(d["median"]));});
        box.select(".box_rect1")
           // .attr("x", function(d){ return (y_log(d["ci0"]<0.1? 0.1:d["ci0"]) - y_log(d["mean"])) - 1;})
           .attr("x", function(d){ return (y_log(d["quartile1"]<min_for_x? min_for_x:d["quartile1"]) - y_log(d["median"])) - 1;});
        box.select(".box_rect2")
           // .attr("x", function(d){ return (y_log(d["ci0"]<0.1? 0.1:d["ci0"]) - y_log(d["mean"])) - 1;})
           .attr("x", function(d){ return (y_log(d["quartile3"]) - y_log(d["median"])) - 1;});
        polygon.transition().duration(500)
            // .attr("transform", function(d) { return "translate(" +  y_log(d["ave"])  + "," + (x(d["name"])+baseY) + ")"; })
            .attr("transform", function(d) { return "translate(" +  y_log(d["median"])  + "," + (x(d["name"])+baseY) + ")"; });

        var new_bar = p_svg.selectAll(".bar")
            .data(bins_log);
        new_bar.transition().duration(500)
            .attr("transform", function(d) { return "translate(" + x_mini_log(d.x<min_for_x?min_for_x:d.x) + "," + (p_height - (p_height * 0.15 - y_mini_log(d.y / d.dx))) + ")"; })
            .each(function(){
                d3.select(this).select("rect")
                    .transition().duration(500)
                    .attr("width", function(d,i){return (x_mini_log(d.x + d.dx) - x_mini_log(d.x)) - 1;})
                    .attr("height", function(d) { return (p_height * 0.15 - y_mini_log(d.y / d.dx)); })
                    .attr("display", "none");
            });
        new_bar.enter().append("g")
            .attr("class", "bar")
            .attr("transform", function(d) { return "translate(" + x_mini_log(d.x<min_for_x?min_for_x:d.x) + "," + (p_height - (p_height * 0.15 - y_mini_log(d.y / d.dx))) + ")"; })
            .each(function(){
                d3.select(this).select("rect")
                    .transition().duration(500)
                    .attr("x", 1)
                    .attr("fill", function(d) { return "rgba(200,200,200,0.85)" })
                    .attr("width", function(d){return (x_mini_log(d.x + d.dx) - x_mini_log(d.x)) - 1;})
                    .attr("height", function(d) { return (p_height * 0.15 - y_mini_log(d.y / d.dx)); })
                    .attr("display", "none");
            });
        new_bar.exit().remove();

        p_svg.select(".time_pattern_line").transition().duration(500)
            .attr("d", valueline_log(bins_log))
            .attr("display", "block");
    });
};

var show_time_pattern = function(){
    var sendHour_data = [], sendDay_data = [];
    var reducer = function(a, b) { return a + b; };
    var days_map = ["1(Mon)", "2(Tue)", "3(Wed)", "4(Thu)", "5(Fri)", "6(Sat)", "7(Sun)"], hours_map = [];
    var the_scale = "normalized_value";
    var current_data = "hour";

    var start_year = Object.keys(emailSentTime[0]['hours'])[0], end_year = Object.keys(emailSentTime[0]['hours'])[0];
    for(var year in emailSentTime[0]['hours']){
        if(year < start_year) start_year = year;
        if(year > end_year) end_year = year;
    }
    var sum_hours = [], sum_days = [];
    for(var k = 0; k < emailSentTime[0]['hours'][Object.keys(emailSentTime[0]['hours'])[0]].length; k++){
        var sum = 0;
        for(var l = 0; l < emailSentTime.length; l++){
            for(var year in emailSentTime[l]['hours'])
                sum += emailSentTime[l]['hours'][year][k]
        }
        sum_hours.push(sum);
    }
    for(var k = 0; k < emailSentTime[0]['days'][Object.keys(emailSentTime[0]['days'])[0]].length; k++){
        var sum = 0;
        for(var l = 0; l < emailSentTime.length; l++){
            for(var year in emailSentTime[l]['days'])
                sum += emailSentTime[l]['days'][k]
        }
        sum_days.push(sum);
    }
    for(var k = 0; k < emailSentTime.length; k++){
        var name = usersinfo[k].name;
        // var sum_hours = emailSentTime[k]['hours'].reduce(reducer),
        //     sum_days = emailSentTime[k]['days'].reduce(reducer);
        for(var year in emailSentTime[k]['hours']){
            for(var jj = 0; jj < emailSentTime[k]['hours'][year].length; jj++){
                var the_time = (jj*2 < 10 ? '0' + (jj*2).toString() : (jj*2).toString()) + ":00 - " + ((jj+1)*2 < 10 ? '0' + ((jj+1)*2).toString() : ((jj+1)*2).toString()) + ":00";
                if(demo == 1)
                    sendHour_data.push({'hour': jj * 2, 'name': demo_people_names_match[name], 'volume': emailSentTime[k]['hours'][year][jj], 'year': year, 'normalized_volume': emailSentTime[k]['hours'][year][jj] / usersinfo[k]['use_length'], 'percentage': parseFloat((emailSentTime[k]['hours'][year][jj]/sum_hours[jj]).toFixed(3)), 'time': the_time});
                else
                    sendHour_data.push({'hour': jj * 2, 'name': name, 'volume': emailSentTime[k]['hours'][year][jj], 'year': year, 'normalized_volume': emailSentTime[k]['hours'][year][jj] / usersinfo[k]['use_length'], 'percentage': parseFloat((emailSentTime[k]['hours'][year][jj]/sum_hours[jj]).toFixed(3)), 'time': the_time});
                hours_map.push(the_time);
            }
        }
        for(var year in emailSentTime[k]['days']){
            for(var jj = 0; jj < emailSentTime[k]['days'][year].length; jj++)
                if(demo == 1)
                    sendDay_data.push({'day': jj, 'name': demo_people_names_match[name], 'volume': emailSentTime[k]['days'][year][jj], 'year': year, 'normalized_volume': emailSentTime[k]['days'][year][jj] / usersinfo[k]['use_length'], 'percentage': parseFloat((emailSentTime[k]['days'][year][jj]/sum_days[jj]).toFixed(3)), 'time': days_map[jj]});
                else
                    sendDay_data.push({'day': jj, 'name': name, 'volume': emailSentTime[k]['days'][year][jj], 'year': year, 'normalized_volume': emailSentTime[k]['days'][year][jj] / usersinfo[k]['use_length'], 'percentage': parseFloat((emailSentTime[k]['days'][year][jj]/sum_days[jj]).toFixed(3)), 'time': days_map[jj]});
        }
    }console.log(sendHour_data);
    var solo = 0;
    d3.select("#time_pattern_svg").selectAll("*").remove();
    var visualization_time_pattern = d3plus.viz()
        .container("#time_pattern_svg")
        .data(sendHour_data)
        .type("stacked")
        .id("name")
        .text("name")
        // .time({"value": "year", "mute": []})
        .y(the_scale == "value"? "volume":(the_scale == "normalized_value"? "normalized_volume":"percentage"))
        .y({"ticks": {"font": {"color": "#fff"}}, "label": {"value": "Emails per day", "padding": 6, "font": {"color": "#fff"}}})
        .x({"value": "time", "label": {"value": "Emails sent hours", "padding": 10, "font": {"color": "#fff"}}})
        .x({"ticks": {"font": {"color": "#fff"}}})
        .tooltip(['volume', 'normalized_volume', 'percentage', 'time'])
        .font({ "size": 14 })
        .background("#2f3140")
        .axes({"background": {"color": "#2f3140"}})
        .mouse({         
          "click": function(){
              d3.select("#time_pattern_svg").select("#data").selectAll("path").on("click", function(d,i){
                if(usersinfo.length != 1){
                    solo = 1 - solo;
                    visualization_time_pattern.id({"solo": solo? (demo == 1? demo_people_names_match[usersinfo[usersinfo.length - 1 - i].name]: usersinfo[usersinfo.length - 1 - i].name):[]}).draw();
                }
            })
          }   
        })
        .draw();


    var the_width = ((end_year - start_year + 1) > 14? 700 : (end_year - start_year + 1) * 50),
        each_width = ((end_year - start_year + 1) > 14? 700 / (end_year - start_year + 1) : 50);
    var timeline_margin = {top: 10, right: 0, bottom: 20, left: 0},
        timeline_width = the_width,
        timeline_height = 40 - timeline_margin.top - timeline_margin.bottom;
    var senttime_timeline_x = d3.time.scale().range([0, timeline_width])
        .domain([new Date(start_year, 0, 1), new Date(end_year, 11, 31)]).nice(); //[new Date(start_year, 1, 1), new Date(end_year, 12, 31)]
    var senttime_timeline_svg = d3.select("#senttime_timeline_svg")
        .attr("width", timeline_width + timeline_margin.left + timeline_margin.right)
        .attr("height", timeline_height + timeline_margin.top + timeline_margin.bottom)
        .style("right", ($(window).width() * 0.8 -the_width) / 2 + "px")
      .append("g")
        .attr("transform", "translate(" + timeline_margin.left + "," + timeline_margin.top + ")");
    senttime_timeline_svg.append("rect").attr("x", 0.5).attr("y", 0.5)
        .attr("width", timeline_width - 1.5).attr("height", 27.5)
        .attr("stroke", "#fff").attr("fill", "rgba(0,0,0,0)");
    var senttime_timeline_brush = d3.svg.brush()
        .x(senttime_timeline_x)
        // .on("brush", senttime_timeline_brushed)
        .on("brushend", senttime_timeline_brushedend);

    var formatNumber2 = d3.format(",.3f");
    var senttime_timeline_xAxis= d3.svg.axis().tickSize(28).outerTickSize(0)
        .scale(senttime_timeline_x).ticks(d3.time.years, 1)
        .orient("bottom");
    var senttime_mini_x = senttime_timeline_svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + 0 + ")")
        .call(senttime_timeline_xAxis);
    senttime_mini_x.selectAll("text")
        .attr("x", each_width / 2 - 18).attr("y", 20)
        .attr("dy", null)
        .style("text-anchor", null);
    function senttime_timeline_brushedend(){
        var new_end_year = end_year, new_start_year = start_year;
        
        if(!senttime_timeline_brush.empty()){
            new_end_year = senttime_timeline_brush.extent()[1].getFullYear(); new_start_year = senttime_timeline_brush.extent()[0].getFullYear();
            new_end_month = senttime_timeline_brush.extent()[1].getMonth(); new_start_month = senttime_timeline_brush.extent()[0].getMonth();
            senttime_timeline_brush.extent([(new_start_month<6? new Date(new_start_year, 0, 1):new Date(new_start_year+1, 0, 1)), (new_end_month<6? new Date(new_end_year-1, 11, 31):new Date(new_end_year, 11, 31))]);
            senttime_timeline_svg.select("g.senttime_timeline_brush").call(senttime_timeline_brush);

            d3.select("#time_pattern_svg").selectAll("*").remove();
            var sum_hours = [], sum_days = [];
            for(var k = 0; k < emailSentTime[0]['hours'][Object.keys(emailSentTime[0]['hours'])[0]].length; k++){
                var sum = 0;
                for(var l = 0; l < emailSentTime.length; l++){
                    for(var year in emailSentTime[l]['hours'])
                        if(year <= new_end_year && year >= new_start_year)
                            sum += emailSentTime[l]['hours'][year][k]
                }
                sum_hours.push(sum);
            }
            for(var k = 0; k < emailSentTime[0]['days'][Object.keys(emailSentTime[0]['days'])[0]].length; k++){
                var sum = 0;
                for(var l = 0; l < emailSentTime.length; l++){
                    for(var year in emailSentTime[l]['days'])
                        sum += emailSentTime[l]['days'][k]
                }
                sum_days.push(sum);
            }
            sendHour_data = []; sendDay_data = [];
            for(var k = 0; k < emailSentTime.length; k++){
                var name = usersinfo[k].name;
                for(var year in emailSentTime[k]['hours']){
                    if(year >= new_start_year && year <= new_end_year){
                        for(var jj = 0; jj < emailSentTime[k]['hours'][year].length; jj++){
                            var the_time = (jj*2 < 10 ? '0' + (jj*2).toString() : (jj*2).toString()) + ":00 - " + ((jj+1)*2 < 10 ? '0' + ((jj+1)*2).toString() : ((jj+1)*2).toString()) + ":00";
                            if(demo == 1)
                                sendHour_data.push({'hour': jj * 2, 'name': demo_people_names_match[name], 'volume': emailSentTime[k]['hours'][year][jj], 'year': year, 'normalized_volume': emailSentTime[k]['hours'][year][jj] / (emailSentTime[k]['hours'][year][jj] == 0 ? 1 : (new_end_year - new_start_year + 1) * 365), 'percentage': parseFloat((emailSentTime[k]['hours'][year][jj]/sum_hours[jj]).toFixed(3)), 'time': the_time});
                            else
                                sendHour_data.push({'hour': jj * 2, 'name': name, 'volume': emailSentTime[k]['hours'][year][jj], 'year': year, 'normalized_volume': emailSentTime[k]['hours'][year][jj] / (emailSentTime[k]['hours'][year][jj] == 0 ? 1 : (new_end_year - new_start_year + 1) * 365), 'percentage': parseFloat((emailSentTime[k]['hours'][year][jj]/sum_hours[jj]).toFixed(3)), 'time': the_time});
                            hours_map.push(the_time);
                        }
                    }
                }
                for(var year in emailSentTime[k]['days']){
                    if(year >= new_start_year && year <= new_end_year){
                        for(var jj = 0; jj < emailSentTime[k]['days'][year].length; jj++){
                            if(demo == 1)
                                sendDay_data.push({'day': jj, 'name': demo_people_names_match[name], 'volume': emailSentTime[k]['days'][year][jj], 'year': year, 'normalized_volume': emailSentTime[k]['days'][year][jj] / (emailSentTime[k]['days'][year][jj] == 0 ? 1 : (new_end_year - new_start_year + 1) * 365), 'percentage': parseFloat((emailSentTime[k]['days'][year][jj]/sum_days[jj]).toFixed(3)), 'time': days_map[jj]});
                            else
                                sendDay_data.push({'day': jj, 'name': name, 'volume': emailSentTime[k]['days'][year][jj], 'year': year, 'normalized_volume': emailSentTime[k]['days'][year][jj] / (emailSentTime[k]['days'][year][jj] == 0 ? 1 : (new_end_year - new_start_year + 1) * 365), 'percentage': parseFloat((emailSentTime[k]['days'][year][jj]/sum_days[jj]).toFixed(3)), 'time': days_map[jj]});
                        }
                    }
                }
            }
            visualization_time_pattern = d3plus.viz()
                .container("#time_pattern_svg")
                .data(current_data == "hour"? sendHour_data:sendDay_data)
                .type("stacked")
                .id("name")
                .text("name")
                // .time({"value": "year", "mute": []})
                .y(the_scale == "value"? "volume":(the_scale == "normalized_value"? "normalized_volume":"percentage"))
                .y({"ticks": {"font": {"color": "#fff"}}, "label": {"value": "Emails per day", "padding": 6, "font": {"color": "#fff"}}})
                .x({"value": "time", "label": {"value": "Emails sent hours", "padding": 10, "font": {"color": "#fff"}}})
                .x({"ticks": {"font": {"color": "#fff"}}})
                .tooltip(['volume', 'normalized_volume', 'percentage', 'time'])
                .font({ "size": 14 })
                .background("#2f3140")
                .axes({"background": {"color": "#2f3140"}})
                .mouse({         
                  "click": function(){
                      d3.select("#time_pattern_svg").select("#data").selectAll("path").on("click", function(d,i){
                        if(usersinfo.length != 1){
                            solo = 1 - solo;
                            visualization_time_pattern.id({"solo": solo? (demo == 1? demo_people_names_match[usersinfo[usersinfo.length - 1 - i].name]: usersinfo[usersinfo.length - 1 - i].name):[]}).draw();
                        }
                    })
                  }   
                })
                .draw();
        }
        else{
            d3.select("#time_pattern_svg").selectAll("*").remove();
            var sum_hours = [], sum_days = [];
            for(var k = 0; k < emailSentTime[0]['hours'][Object.keys(emailSentTime[0]['hours'])[0]].length; k++){
                var sum = 0;
                for(var l = 0; l < emailSentTime.length; l++){
                    for(var year in emailSentTime[l]['hours'])
                        if(year <= new_end_year && year >= new_start_year)
                            sum += emailSentTime[l]['hours'][year][k]
                }
                sum_hours.push(sum);
            }
            for(var k = 0; k < emailSentTime[0]['days'][Object.keys(emailSentTime[0]['days'])[0]].length; k++){
                var sum = 0;
                for(var l = 0; l < emailSentTime.length; l++){
                    for(var year in emailSentTime[l]['days'])
                        sum += emailSentTime[l]['days'][k]
                }
                sum_days.push(sum);
            }
            sendHour_data = []; sendDay_data = [];
            for(var k = 0; k < emailSentTime.length; k++){
                var name = usersinfo[k].name;
                for(var year in emailSentTime[k]['hours']){
                    if(year >= new_start_year && year <= new_end_year){
                        for(var jj = 0; jj < emailSentTime[k]['hours'][year].length; jj++){
                            var the_time = (jj*2 < 10 ? '0' + (jj*2).toString() : (jj*2).toString()) + ":00 - " + ((jj+1)*2 < 10 ? '0' + ((jj+1)*2).toString() : ((jj+1)*2).toString()) + ":00";
                            if(demo == 1)
                                sendHour_data.push({'hour': jj * 2, 'name': demo_people_names_match[name], 'volume': emailSentTime[k]['hours'][year][jj], 'year': year, 'normalized_volume': emailSentTime[k]['hours'][year][jj] / usersinfo[k]['use_length'], 'percentage': parseFloat((emailSentTime[k]['hours'][year][jj]/sum_hours[jj]).toFixed(3)), 'time': the_time});
                            else
                                sendHour_data.push({'hour': jj * 2, 'name': name, 'volume': emailSentTime[k]['hours'][year][jj], 'year': year, 'normalized_volume': emailSentTime[k]['hours'][year][jj] / usersinfo[k]['use_length'], 'percentage': parseFloat((emailSentTime[k]['hours'][year][jj]/sum_hours[jj]).toFixed(3)), 'time': the_time});
                            hours_map.push(the_time);
                        }
                    }
                }
                for(var year in emailSentTime[k]['days']){
                    if(year >= new_start_year && year <= new_end_year){
                        for(var jj = 0; jj < emailSentTime[k]['days'][year].length; jj++){
                            if(demo == 1)
                                sendDay_data.push({'day': jj, 'name': demo_people_names_match[name], 'volume': emailSentTime[k]['days'][year][jj], 'year': year, 'normalized_volume': emailSentTime[k]['days'][year][jj] / usersinfo[k]['use_length'], 'percentage': parseFloat((emailSentTime[k]['days'][year][jj]/sum_days[jj]).toFixed(3)), 'time': days_map[jj]});
                            else
                                sendDay_data.push({'day': jj, 'name': name, 'volume': emailSentTime[k]['days'][year][jj], 'year': year, 'normalized_volume': emailSentTime[k]['days'][year][jj] / usersinfo[k]['use_length'], 'percentage': parseFloat((emailSentTime[k]['days'][year][jj]/sum_days[jj]).toFixed(3)), 'time': days_map[jj]});
                        }
                    }
                }
            }
            visualization_time_pattern = d3plus.viz()
                .container("#time_pattern_svg")
                .data(current_data == "hour"? sendHour_data:sendDay_data)
                .type("stacked")
                .id("name")
                .text("name")
                // .time({"value": "year", "mute": []})
                .y(the_scale == "value"? "volume":(the_scale == "normalized_value"? "normalized_volume":"percentage"))
                .y({"ticks": {"font": {"color": "#fff"}}, "label": {"value": "Emails per day", "padding": 6, "font": {"color": "#fff"}}})
                .x({"value": "time", "label": {"value": "Emails sent hours", "padding": 10, "font": {"color": "#fff"}}})
                .x({"ticks": {"font": {"color": "#fff"}}})
                .tooltip(['volume', 'normalized_volume', 'percentage', 'time'])
                .font({ "size": 14 })
                .background("#2f3140")
                .axes({"background": {"color": "#2f3140"}})
                .mouse({         
                  "click": function(){
                      d3.select("#time_pattern_svg").select("#data").selectAll("path").on("click", function(d,i){
                        if(usersinfo.length != 1){
                            solo = 1 - solo;
                            visualization_time_pattern.id({"solo": solo? (demo == 1? demo_people_names_match[usersinfo[usersinfo.length - 1 - i].name]: usersinfo[usersinfo.length - 1 - i].name):[]}).draw();
                        }
                    })
                  }   
                })
                .draw();
        }
    }
    var brush_x_grab = senttime_timeline_svg.append("g")
            .attr("class", "senttime_timeline_brush")
            .attr("transform", "translate(-0, -" + 0 + ")")
            .call(senttime_timeline_brush);
    brush_x_grab.selectAll("rect").attr("height", 28);

    d3.select("#time_pattern_switch").select("#by_hour").on("click", function(){
        current_data = "hour";
        d3.select("#time_pattern_switch").select("#by_day").style("background-color", "rgba(184,184,184,0)");
        d3.select("#time_pattern_switch").select("#by_hour").style("background-color", "rgba(184,184,184,1)");

        d3.select("#time_pattern_svg").selectAll("*").remove();
        visualization_time_pattern = d3plus.viz()
            .container("#time_pattern_svg")
            .data(sendHour_data)
            .type("stacked")
            .background("#2f3140")
            .axes({"background": {"color": "#2f3140"}})
            .id("name")
            .text("name")
            .y(the_scale == "value"? "volume":(the_scale == "normalized_value"? "normalized_volume":"percentage"))
            .y({"ticks": {"font": {"color": "#fff"}}, "label": {"value": "Emails per day", "padding": 6, "font": {"color": "#fff"}}})
            .x({"value": "time", "label": {"value": "Emails sent hours", "font": {"color": "#fff"}}})
            .x({"ticks": {"font": {"color": "#fff"}}})
            .tooltip(['volume', 'percentage', 'time'])
            .font({ "size": 14 })
            .mouse({         
              "click": function(){
                  d3.select("#time_pattern_svg").select("#data").selectAll("path").on("click", function(d,i){
                    if(usersinfo.length != 1){
                        solo = 1 - solo;
                        visualization_time_pattern.id({"solo": solo? (demo == 1? demo_people_names_match[usersinfo[usersinfo.length - 1 - i].name]: usersinfo[usersinfo.length - 1 - i].name):[]}).draw();
                    }
                })
              }   
            })
            .draw();
    });
    d3.select("#time_pattern_switch").select("#by_day").on("click", function(){
        current_data = "day";
        d3.select("#time_pattern_switch").select("#by_hour").style("background-color", "rgba(184,184,184,0)");
        d3.select("#time_pattern_switch").select("#by_day").style("background-color", "rgba(184,184,184,1)");

        d3.select("#time_pattern_svg").selectAll("*").remove();
        visualization_time_pattern = d3plus.viz()
            .container("#time_pattern_svg")
            .data(sendDay_data)
            .type("stacked")
            .background("#2f3140")
            .axes({"background": {"color": "#2f3140"}})
            .id("name")
            .text("name")
            .y(the_scale == "value"? "volume":(the_scale == "normalized_value"? "normalized_volume":"percentage"))
            .y({"ticks": {"font": {"color": "#fff"}}, "label": {"value": "Emails per day", "padding": 6, "font": {"color": "#fff"}}})
            .x({"value": "time", "label": {"value": "Emails sent days", "font": {"color": "#fff"}}})
            .x({"ticks": {"font": {"color": "#fff"}}})
            .tooltip(['volume', 'percentage', 'time'])
            .font({ "size": 14 })
            .mouse({         
              "click": function(){
                  d3.select("#time_pattern_svg").select("#data").selectAll("path").on("click", function(d,i){
                    if(usersinfo.length != 1){
                        solo = 1 - solo;
                        visualization_time_pattern.id({"solo": solo? (demo == 1? demo_people_names_match[usersinfo[usersinfo.length - 1 - i].name]: usersinfo[usersinfo.length - 1 - i].name):[]}).draw();
                    }
                })
              }   
            })
            .draw();
    });

    d3.select("#time_scale_switch").select("#by_real_value").on("click", function(){
        the_scale = "value";
        d3.select("#time_scale_switch").select("#by_percentage").style("background-color", "rgba(184,184,184,0)");
        d3.select("#time_scale_switch").select("#by_normalized_value").style("background-color", "rgba(184,184,184,0)");
        d3.select("#time_scale_switch").select("#by_real_value").style("background-color", "rgba(184,184,184,1)");

        visualization_time_pattern
            .y("volume")
            .y({"range": false, "label": {"value": "Emails", "padding": 6, "font": {"color": "#fff"}}})
            .draw();
    });
    d3.select("#time_scale_switch").select("#by_normalized_value").on("click", function(){
        the_scale = "normalized_value";
        d3.select("#time_scale_switch").select("#by_percentage").style("background-color", "rgba(184,184,184,0)");
        d3.select("#time_scale_switch").select("#by_normalized_value").style("background-color", "rgba(184,184,184,1)");
        d3.select("#time_scale_switch").select("#by_real_value").style("background-color", "rgba(184,184,184,0)");

        visualization_time_pattern
            .y("normalized_volume")
            .y({"range": false, "label": {"value": "Emails per day", "padding": 6, "font": {"color": "#fff"}}})
            .draw();
    });
    d3.select("#time_scale_switch").select("#by_percentage").on("click", function(){
        the_scale = "percentage";
        d3.select("#time_scale_switch").select("#by_real_value").style("background-color", "rgba(184,184,184,0)");
        d3.select("#time_scale_switch").select("#by_normalized_value").style("background-color", "rgba(184,184,184,0)");
        d3.select("#time_scale_switch").select("#by_percentage").style("background-color", "rgba(184,184,184,1)");

        visualization_time_pattern
            .y("percentage")
            .y({"range": [0, 1], "label": {"value": "Percentage of emails", "padding": 6, "font": {"color": "#fff"}}})
            .draw();
    });
};

var change_panel = function(panel){
    panel_ind = panel;
    if(panel == 3){ //show time pattern data
        d3.select("#analysis_summary_cover").style("display", "block");
        d3.select("#analysis_time_pattern_cover").style("display", "none");
        d3.select("#analysis_survey_cover").style("display", "none");
        d3.select("#analysis_response_time_cover").style("display", "none");
        d3.select("#analysis_pairs_cover").style("display", "none");
        d3.select("#analysis_table_cover").style("display", "none");
        d3.select("#analysis_personality_svg_cover").style("display", "none");
        d3.select("#analysis_histo_cover").style("display", "none");
        d3.select("#analysis_histo_cover2").style("display", "none");
        
        d3.select("#summary_icon").style("border", "1px solid white");
        d3.select("#time_pattern_icon").style("border", "0px solid white");
        d3.select("#survey_icon").style("border", "0px solid white");
        d3.select("#response_time_icon").style("border", "0px solid white");
        d3.select("#curve_icon").style("border", "0px solid white");
        d3.select("#histo_icon").style("border", "0px solid white");
        d3.select("#histo2_icon").style("border", "0px solid white");
        d3.select("#table_icon").style("border", "0px solid white");
        d3.select("#axis_icon").style("border", "0px solid white");

        d3.select(".views").style("display", "none");
        d3.selectAll("#d3plus_graph_background").style("fill","rgba(0,0,0,0)");

        if(summary_done == 0){
            show_team_summary();
            summary_done = 1;
        }
    }
    else if(panel == 4){ //coordinates panel
        d3.select("#analysis_personality_svg_cover").style("display", "block");
        d3.select("#analysis_summary_cover").style("display", "none");
        d3.select("#analysis_response_time_cover").style("display", "none");
        d3.select("#analysis_time_pattern_cover").style("display", "none");
        d3.select("#analysis_survey_cover").style("display", "none");
        d3.select("#analysis_histo_cover").style("display", "none");
        d3.select("#analysis_histo_cover2").style("display", "none");
        d3.select("#analysis_table_cover").style("display", "none");
        d3.select("#analysis_pairs_cover").style("display", "none");   
        
        d3.select("#axis_icon").style("border", "1px solid white");
        d3.select("#summary_icon").style("border", "0px solid white");
        d3.select("#response_time_icon").style("border", "0px solid white");
        d3.select("#time_pattern_icon").style("border", "0px solid white");
        d3.select("#survey_icon").style("border", "0px solid white");
        d3.select("#histo_icon").style("border", "0px solid white");
        d3.select("#histo2_icon").style("border", "0px solid white");
        d3.select("#table_icon").style("border", "0px solid white");
        d3.select("#curve_icon").style("border", "0px solid white");

        d3.select(".views").style("display", "block");
       
    }
    else if(panel == 5){ //curve panel
        d3.select("#analysis_pairs_cover").style("display", "block");
        d3.select("#analysis_summary_cover").style("display", "none");
        d3.select("#analysis_response_time_cover").style("display", "none");
        d3.select("#analysis_time_pattern_cover").style("display", "none");
        d3.select("#analysis_survey_cover").style("display", "none");
        d3.select("#analysis_table_cover").style("display", "none");
        d3.select("#analysis_personality_svg_cover").style("display", "none");
        d3.select("#analysis_histo_cover").style("display", "none");
        d3.select("#analysis_histo_cover2").style("display", "none");
        
        d3.select("#curve_icon").style("border", "1px solid white");
        d3.select("#summary_icon").style("border", "0px solid white");
        d3.select("#response_time_icon").style("border", "0px solid white");
        d3.select("#time_pattern_icon").style("border", "0px solid white");
        d3.select("#survey_icon").style("border", "0px solid white");
        d3.select("#histo_icon").style("border", "0px solid white");
        d3.select("#histo2_icon").style("border", "0px solid white");
        d3.select("#table_icon").style("border", "0px solid white");
        d3.select("#axis_icon").style("border", "0px solid white");

        d3.select(".views").style("display", "none");
    }
    else if(panel == 6){ //response time panel
        d3.select("#analysis_response_time_cover").style("display", "block");
        d3.select("#analysis_summary_cover").style("display", "none");
        d3.select("#analysis_time_pattern_cover").style("display", "none");
        d3.select("#analysis_pairs_cover").style("display", "none");
        d3.select("#analysis_survey_cover").style("display", "none");
        d3.select("#analysis_table_cover").style("display", "none");
        d3.select("#analysis_personality_svg_cover").style("display", "none");
        d3.select("#analysis_histo_cover").style("display", "none");
        d3.select("#analysis_histo_cover2").style("display", "none");
        
        d3.select("#response_time_icon").style("border", "1px solid white");
        d3.select("#summary_icon").style("border", "0px solid white");
        d3.select("#time_pattern_icon").style("border", "0px solid white");
        d3.select("#curve_icon").style("border", "0px solid white");
        d3.select("#survey_icon").style("border", "0px solid white");
        d3.select("#histo_icon").style("border", "0px solid white");
        d3.select("#histo2_icon").style("border", "0px solid white");
        d3.select("#table_icon").style("border", "0px solid white");
        d3.select("#axis_icon").style("border", "0px solid white");

        d3.select(".views").style("display", "none");
        d3.selectAll("#d3plus_graph_background").style("fill","rgba(0,0,0,0)");
    }
    else if(panel == 7){ //show time pattern data
        d3.select("#analysis_time_pattern_cover").style("display", "block");
        d3.select("#analysis_summary_cover").style("display", "none");
        d3.select("#analysis_survey_cover").style("display", "none");
        d3.select("#analysis_response_time_cover").style("display", "none");
        d3.select("#analysis_pairs_cover").style("display", "none");
        d3.select("#analysis_table_cover").style("display", "none");
        d3.select("#analysis_personality_svg_cover").style("display", "none");
        d3.select("#analysis_histo_cover").style("display", "none");
        d3.select("#analysis_histo_cover2").style("display", "none");
        
        d3.select("#time_pattern_icon").style("border", "1px solid white");
        d3.select("#summary_icon").style("border", "0px solid white");
        d3.select("#survey_icon").style("border", "0px solid white");
        d3.select("#response_time_icon").style("border", "0px solid white");
        d3.select("#curve_icon").style("border", "0px solid white");
        d3.select("#histo_icon").style("border", "0px solid white");
        d3.select("#histo2_icon").style("border", "0px solid white");
        d3.select("#table_icon").style("border", "0px solid white");
        d3.select("#axis_icon").style("border", "0px solid white");

        d3.select(".views").style("display", "none");
        d3.selectAll("#d3plus_graph_background").style("fill","rgba(0,0,0,0)");

        if(senttime_done == 0){
            show_time_pattern();
            senttime_done = 1;
        }
    }
    else if(panel == 0){ //histogram panel
        d3.select("#analysis_histo_cover").style("display", "block");
        d3.select("#analysis_summary_cover").style("display", "none");
        d3.select("#analysis_response_time_cover").style("display", "none");
        d3.select("#analysis_time_pattern_cover").style("display", "none");
        d3.select("#analysis_histo_cover2").style("display", "none");
        d3.select("#analysis_survey_cover").style("display", "none");
        d3.select("#analysis_table_cover").style("display", "none");
        d3.select("#analysis_personality_svg_cover").style("display", "none");
        d3.select("#analysis_pairs_cover").style("display", "none");
        
        d3.select("#histo_icon").style("border", "1px solid white");
        d3.select("#summary_icon").style("border", "0px solid white");
        d3.select("#response_time_icon").style("border", "0px solid white");
        d3.select("#time_pattern_icon").style("border", "0px solid white");
        d3.select("#histo2_icon").style("border", "0px solid white");
        d3.select("#survey_icon").style("border", "0px solid white");
        d3.select("#table_icon").style("border", "0px solid white");
        d3.select("#axis_icon").style("border", "0px solid white");
        d3.select("#curve_icon").style("border", "0px solid white");

        d3.select(".views").style("display", "none");
        d3.selectAll("#d3plus_graph_background").style("fill","rgba(0,0,0,0)");
    }
    else if(panel == 1){ //histogram panel
        d3.select("#analysis_histo_cover2").style("display", "block");
        d3.select("#analysis_summary_cover").style("display", "none");
        d3.select("#analysis_response_time_cover").style("display", "none");
        d3.select("#analysis_time_pattern_cover").style("display", "none");
        d3.select("#analysis_histo_cover").style("display", "none");
        d3.select("#analysis_survey_cover").style("display", "none");
        d3.select("#analysis_table_cover").style("display", "none");
        d3.select("#analysis_personality_svg_cover").style("display", "none");
        d3.select("#analysis_pairs_cover").style("display", "none");
        
        d3.select("#histo2_icon").style("border", "1px solid white");
        d3.select("#summary_icon").style("border", "0px solid white");
        d3.select("#response_time_icon").style("border", "0px solid white");
        d3.select("#time_pattern_icon").style("border", "0px solid white");
        d3.select("#histo_icon").style("border", "0px solid white");
        d3.select("#survey_icon").style("border", "0px solid white");
        d3.select("#table_icon").style("border", "0px solid white");
        d3.select("#axis_icon").style("border", "0px solid white");
        d3.select("#curve_icon").style("border", "0px solid white");

        d3.select(".views").style("display", "none");
        d3.selectAll("#d3plus_graph_background").style("fill","rgba(0,0,0,0)");

        if(histo2_done == 0){ 
            show_histo_results2();
            histo2_done = 1;
        }
    }
    else if(panel == 2){ //show survey data
        d3.select("#analysis_survey_cover").style("display", "block");
        d3.select("#analysis_summary_cover").style("display", "none");
        d3.select("#analysis_response_time_cover").style("display", "none");
        d3.select("#analysis_time_pattern_cover").style("display", "none");
        d3.select("#analysis_pairs_cover").style("display", "none");
        d3.select("#analysis_table_cover").style("display", "none");
        d3.select("#analysis_personality_svg_cover").style("display", "none");
        d3.select("#analysis_histo_cover").style("display", "none");
        d3.select("#analysis_histo_cover2").style("display", "none");
        
        d3.select("#survey_icon").style("border", "1px solid white");
        d3.select("#summary_icon").style("border", "0px solid white");
        d3.select("#response_time_icon").style("border", "0px solid white");
        d3.select("#time_pattern_icon").style("border", "0px solid white");
        d3.select("#curve_icon").style("border", "0px solid white");
        d3.select("#histo_icon").style("border", "0px solid white");
        d3.select("#histo2_icon").style("border", "0px solid white");
        d3.select("#table_icon").style("border", "0px solid white");
        d3.select("#axis_icon").style("border", "0px solid white");

        d3.select(".views").style("display", "none");
    }
};
function arrow_switch_panel(direction){
    if(direction == 0){//left
        change_panel((panel_ind - 1 + panel_count)%panel_count);
    }
    else{
        change_panel((panel_ind + 1)%panel_count);
    }
}
function change_subview(view){
    if(view == 0){//coord
    	d3.select("#table").style("border", "none").style("border-right", "1px solid white");
    	d3.select("#table").select("img").style("opacity", 0.2);
    	d3.select("#coord").style("border", "none").style("border-left", "1px solid white").style("border-top", "1px solid white").style("border-bottom", "1px solid white");
    	d3.select("#coord").select("img").style("opacity", 1);

    	d3.select("#analysis_table_cover").style("display", "none");
        d3.select("#analysis_personality_svg_cover").style("display", "block");
    }
    else{//table
    	d3.select("#coord").style("border", "none").style("border-right", "1px solid white");
    	d3.select("#coord").select("img").style("opacity", 0.2);
    	d3.select("#table").style("border", "none").style("border-left", "1px solid white").style("border-top", "1px solid white").style("border-bottom", "1px solid white");
    	d3.select("#table").select("img").style("opacity", 1);

    	d3.select("#analysis_table_cover").style("display", "block");
        d3.select("#analysis_personality_svg_cover").style("display", "none");
    }
}
$(document).ready(function () {
    $.post('/get_network_structure', {'json': JSON.stringify({id: team_id})}) //contact.name
        .success(function (returned_data) {
            if(returned_data['success'] == true){
                var idToIndex = {};
                for(var jj = 0; jj < usersinfo.length; jj++){
                    for(var kk = 0; kk < returned_data['network']['nodes'].length; kk++){
                        if(returned_data['network']['nodes'][kk].attr.contact.aliases.indexOf(usersinfo[jj]['email']) != -1){
                            usersinfo[jj]['id'] = returned_data['network']['nodes'][kk].temp_id;
                            idToIndex[returned_data['network']['nodes'][kk].temp_id] = jj;
                            break;
                        }
                    }
                }
                for(var kk = 0; kk < returned_data['network']['links'].length; kk++){
                    var src = idToIndex[returned_data['network']['links'][kk]['source']],
                        trg = idToIndex[returned_data['network']['links'][kk]['target']];
                    // if(!(src in idToNeighbors)){
                    //     idToNeighbors[src] = [];
                    // }
                    // if(!(trg in idToNeighbors)){
                    //     idToNeighbors[trg] = [];
                    // }
                    // idToNeighbors[src].push(trg);
                    // idToNeighbors[trg].push(src);

                    if(!(src in indexToNeighbors)){
                        indexToNeighbors[src] = [];
                    }
                    if(!(trg in indexToNeighbors)){
                        indexToNeighbors[trg] = [];
                    }
                    indexToNeighbors[src].push(trg);
                    indexToNeighbors[trg].push(src);
                }

                var id_pairs = {};
                var p_svg = d3.select("#analysis_personality_svg").select("g");
                for(var i = 0; i < usersinfo.length; i++){
                    console.log(i);
                    for(var kk = 0; kk < indexToNeighbors[i].length; kk++){
                        var n1, n2;
                        if(i < parseInt(indexToNeighbors[i][kk])){
                            n1 = coordinates_data[i]; n2 = coordinates_data[indexToNeighbors[i][kk]];
                        }
                        else{
                            n2 = coordinates_data[i]; n1 = coordinates_data[indexToNeighbors[i][kk]];
                        } 
                        var id_pair = parseInt(i) < parseInt(indexToNeighbors[i][kk]) ? (i+"_"+indexToNeighbors[i][kk]):(indexToNeighbors[i][kk]+"_"+i);
                        if(!id_pairs[id_pair]){
                            id_pairs[id_pair] = true;
                            p_svg.append("line").attr("class", "links")
                                .attr("id", "link" + id_pair)
                                .attr("stroke-width", "1").style("stroke", "rgb(150,150,150)")
                                .style("visibility", function (d) { 
                                    return coordinates_xMap(n1)<0||coordinates_xMap(n2)<0||coordinates_yMap(n1)<0||coordinates_yMap(n2)<0? "hidden":"visible"; 
                                })
                                .attr("x1", coordinates_xMap(n1)).attr("y1", coordinates_yMap(n1))
                                .attr("x2", coordinates_xMap(n2))
                                .attr("y2", coordinates_yMap(n2))
                                .style("opacity", 0);
                        }
                    }
                }
            }
        }
    );
    show_personality_results();
    show_histo_results();
    // show_histo_results2();
    show_table_results();
    show_pairs_results();
    show_survey_results();
    show_response_time();
    // show_time_pattern();
    
    d3.select("#axis_icon").style("border", "0px solid white");
    d3.select("#table_icon").style("border", "0px solid white");
    d3.select("#curve_icon").style("border", "0px solid white");
    d3.select("#histo2_icon").style("border", "0px solid white");
    d3.select("#time_pattern_icon").style("border", "0px solid white");
    d3.select("#response_time_icon").style("border", "0px solid white");
    d3.select("#histo_icon").style("border", "1px solid white");
});


