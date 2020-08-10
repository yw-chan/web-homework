Array.prototype.getLast = function() {
    return this[this.length - 1];
};

Array.prototype.isEmpty = function() {
    return this.length == 0;
};

function isNum(c) {
    return c === '0' || c === '1' || c === '2' || c === '3' || c === '4' || c === '5' || c === '6' || c === '7' || c === '8' || c === '9';
}
function isOper(c) {
    return c === '+' || c === '-' || c === '*' || c === '/' || c === '(' || c === ')';
}

function priority(c) {
    return c === '+' || c === '-' ? 1 : c === '*' || c === '/' ? 2 : 0;
}



function toPostfix(infix, isPost) {
    isPost = isPost === undefined ? true : false;
    var expr = isPost ? infix.split('') : infix.split('').reverse();
    var stack = [];
    var output = [];
    var toStack = isPost ? '(' : ')';
    var toOutput = isPost ? ')' : '(';
    var tmp = '', num = '';
    expr.forEach(function(c) {
        // console.log(tmp);
        // console.log(c,stack.getLast(),tmp);
        if(c === toStack) { 
            num=tmp;tmp='';if(num!=''&&tmp=='')output.push(num); 
            stack.push(c); 
        }
        else if('+-*/'.indexOf(c) !== -1) {
            num=tmp;tmp='';if(num!=''&&tmp=='')output.push(num);
            while(!stack.isEmpty() && 
                   priority(stack.getLast()) >= priority(c)) {
                output.push(stack.pop());
            }
            stack.push(c);
        }
        else if(c === toOutput) {
            num=tmp;tmp='';if(num!=''&&tmp=='')output.push(num);
            while(stack.getLast() !== toStack) {
                output.push(stack.pop());
            }
            stack.pop();
        }
        else {
            tmp  = isPost ? tmp+c : c+tmp;
        }
    });
    
    while(!stack.isEmpty()) { output.push(stack.pop()); }
    
    return isPost ? output.join(' ') : output.reverse().join(' ');
}

function toPrefix(infix) {
    return toPostfix(infix, false);
}

function evaluate(expr) {
    var stack = [];
    toPostfix(expr).split(' ').forEach(function(c) {
        if('+-*/'.indexOf(c) !== -1) {
            var p2 = stack.pop();
            var p1 = stack.pop();
            stack.push(cal(c, p1, p2));
        } else {
            stack.push(parseInt(c));
        }
    });
    return stack.pop();
}

function cal(op, p1, p2) {
    switch(op) {
        case '+': return p1 + p2;
        case '-': return p1 - p2;
        case '*': return p1 * p2;
        case '/': return p1 / p2;
        default: console.log("cal:error");
    }
}
var infix = "(10+20)*(300+4)";
// console.log(infix);
console.log('Prefix :',toPrefix(infix));
console.log('Postfix:',toPostfix(infix));
console.log(infix,'=',evaluate(infix));