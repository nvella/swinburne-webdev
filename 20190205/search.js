function doSearch(query) {
    $.ajax({
        url: `https://swapi.co/api/people/?search=${query}`,
        dataType: "json",
        success: (data) => {
            $('#results').html('');
            for(let char of data.results) {
                $('#results').append(`<li>${char.name}</li>`)
            }
        }
    })
}

let timeout;

$('#search').on('input', ev => {
    $('#results').html('Loading...');
    if(timeout) clearTimeout(timeout);
    timeout = setTimeout(() => doSearch(ev.target.value), 100);
});