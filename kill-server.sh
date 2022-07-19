#!/bin/bash
kill $(ps aux | grep '[p]hp -S localhost:' | awk '{print $2}')