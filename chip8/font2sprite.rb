# font2sprite.rb
# input: font.txt, rom on ARGV[0]
# output: src/rom.js

require 'json'

class Array
    def rjust(n, x); Array.new([0, n-length].max, x)+self end
    def ljust(n, x); dup.fill(x, length...n) end
end

font = File.read('font.txt').lines.map do |l| 
    l.chomp.ljust(8, ' ')
        .chars.map{|c| c == '.' ? 1 : 0}
        .each_with_index.map{|x, i| x << 7 - i}
end.map{|c| c.inject(0){|sum, x| sum | x}}

rom = font.ljust(0x200, 0) + File.read(ARGV[0]).bytes

File.open('dist/rom.js', 'w') do |f|
    f.puts("const rom = #{JSON.generate(rom)};")
end 