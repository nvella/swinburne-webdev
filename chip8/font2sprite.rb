# font2sprite.rb
# input: font.txt
# output: src/rom.js

require 'json'

font = File.read('font.txt').lines.map {|l| l.chomp.ljust(8, ' ').chars.map{|c| c == '.' ? 1 : 0}.each_with_index.map{|x, i| x << 7 - i}}.map{|c| c.inject(0){|sum, x| sum | x}}.each_slice(5).to_a.flatten

File.open('dist/rom.js', 'w') do |f|
    f.puts("const rom = #{JSON.generate(font)};")
end