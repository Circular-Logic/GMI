QUnit.test( "hello test", function( assert ) {
  assert.ok( 1 == "1", "Passed!" );
});

QUnit.test("square exists", function(){
	ok(square, "square exists");
});

QUnit.test("square is function", function(){
	ok(typeof square === 'function', "square is a function");
});

QUnit.test("square returns", function(){
	for(var i = 0; i < 10; i++){
		equal(square(i), i * i, "Square of " + i +" is " + (i * i));
	}
});